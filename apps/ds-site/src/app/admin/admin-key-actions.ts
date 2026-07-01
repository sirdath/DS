'use server'

/**
 * Each founder's own Anthropic credential, stored against their Supabase admin account
 * (admin_api_keys, owner-only RLS). The Competitors scan reads the logged-in founder's
 * row — Dath's scans use Dath's credential, Stel's use Stel's. The full value never
 * leaves the server: status returns a masked form only.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSessionUser, getSupabaseServerClient } from './lib/supabase-server'

export type CredentialKind = 'api' | 'oauth' | 'other'

export interface CredentialStatus {
  set: boolean
  masked: string | null
  kind: CredentialKind | null
}

function kindOf(cred: string): CredentialKind {
  if (cred.startsWith('sk-ant-oat')) return 'oauth'
  if (cred.startsWith('sk-ant-api')) return 'api'
  return 'other'
}

function mask(cred: string): string {
  const tail = cred.slice(-4)
  return `sk-ant-…${tail}`
}

export async function getCredentialStatus(): Promise<CredentialStatus> {
  await assertAdmin()
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.from('admin_api_keys').select('credential').maybeSingle()
  const cred = typeof data?.credential === 'string' ? data.credential.trim() : ''
  if (!cred) return { set: false, masked: null, kind: null }
  return { set: true, masked: mask(cred), kind: kindOf(cred) }
}

export async function saveCredential(raw: string): Promise<void> {
  await assertAdmin()
  const cred = raw.trim()
  if (!/^sk-ant-/.test(cred)) {
    throw new Error('That does not look like an Anthropic credential — expected it to start with sk-ant-.')
  }
  const user = await getSessionUser()
  if (!user) throw new Error('Not signed in.')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('admin_api_keys')
    .upsert({ user_id: user.id, credential: cred }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/competitors')
}

export async function clearCredential(): Promise<void> {
  await assertAdmin()
  const user = await getSessionUser()
  if (!user) return
  const supabase = await getSupabaseServerClient()
  await supabase.from('admin_api_keys').delete().eq('user_id', user.id)
  revalidatePath('/admin/competitors')
}
