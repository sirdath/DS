import 'server-only'

/**
 * Durable per-tenant persistence for Xenia conversations (xenia_* tables,
 * 20260614_xenia_workspace.sql). Best-effort: a persistence failure (table not
 * migrated yet, transient DB error) must never fail the customer's reply, so
 * everything is caught and reported as null. Never logs message text.
 */

import type { ConversationState } from '@ds/xenia'
import { getSupabaseServerClient } from '../../../admin/lib/supabase-server'

interface PersistTurnInput {
  userId: string
  conversationId: string | null
  prevStatus: string
  state: ConversationState
  userText: string
  reply: string
}

/** Persist one turn: upsert the conversation, append both messages, and record the
 *  appointment when this turn confirmed it. Returns the conversation id, or null. */
export async function persistTurn(input: PersistTurnInput): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { state } = input

    let conversationId = input.conversationId
    if (conversationId) {
      await supabase
        .from('xenia_conversations')
        .update({ status: state.status, lang: state.lang, slots: state.slots })
        .eq('id', conversationId)
    } else {
      const { data, error } = await supabase
        .from('xenia_conversations')
        .insert({ user_id: input.userId, status: state.status, lang: state.lang, slots: state.slots })
        .select('id')
        .single()
      if (error || !data) return null
      conversationId = String(data.id)
    }

    await supabase.from('xenia_messages').insert([
      { conversation_id: conversationId, role: 'user', text: input.userText },
      { conversation_id: conversationId, role: 'assistant', text: input.reply },
    ])

    // Record the booking once, on the turn that confirmed it.
    if (state.status === 'confirmed' && input.prevStatus !== 'confirmed' && state.slots.serviceId) {
      await supabase.from('xenia_appointments').insert({
        user_id: input.userId,
        conversation_id: conversationId,
        service_id: state.slots.serviceId,
        appt_date: state.slots.date ?? null,
        appt_time: state.slots.time ?? '',
        party_size: state.slots.partySize ?? 1,
        name: state.slots.name ?? '',
        contact: state.slots.contact ?? '',
      })
    }

    return conversationId
  } catch {
    return null
  }
}
