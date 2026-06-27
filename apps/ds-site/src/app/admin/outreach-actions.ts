'use server'

/**
 * Server actions for the outreach surface. The heavy research runs in the route
 * handler (it needs maxDuration); these are the small mutations. Each asserts admin,
 * then mutates through the RLS-scoped client.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSupabaseServerClient } from './lib/supabase-server'

const PATH = '/admin/funnel/outreach'

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

export async function markContacted(leadId: string): Promise<void> {
  if (!leadId) throw new Error('Missing leadId')
  const supabase = await db()
  const { error } = await supabase.from('marketing_leads').update({ contacted: true, status: 'contacted' }).eq('id', leadId)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function deleteBrief(briefId: string): Promise<void> {
  if (!briefId) throw new Error('Missing briefId')
  const supabase = await db()
  const { error } = await supabase.from('outreach_briefs').delete().eq('id', briefId)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}
