import 'server-only'

/**
 * Resolve the logged-in founder's Anthropic credential: their own row in
 * admin_api_keys (RLS returns only theirs), else their entry in the
 * ADMIN_ANTHROPIC_KEYS env map (email=key,email=key), else the shared
 * ANTHROPIC_API_KEY. Mirrors the Competitors scan so billing stays per-founder.
 */

import Anthropic from '@anthropic-ai/sdk'
import { getSessionUser, getSupabaseServerClient } from './supabase-server'

function keyForEmail(email: string | null | undefined): string | undefined {
  const target = (email ?? '').trim().toLowerCase()
  if (target) {
    const raw = process.env.ADMIN_ANTHROPIC_KEYS ?? ''
    for (const pair of raw.split(',')) {
      const i = pair.indexOf('=')
      if (i === -1) continue
      if (pair.slice(0, i).trim().toLowerCase() === target) {
        const key = pair.slice(i + 1).trim()
        if (key) return key
      }
    }
  }
  return process.env.ANTHROPIC_API_KEY
}

export async function getFounderCredential(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data } = await supabase.from('admin_api_keys').select('credential').maybeSingle()
    const stored = typeof data?.credential === 'string' ? data.credential.trim() : ''
    if (stored) return stored
  } catch {
    // fall through to env
  }
  let email: string | null = null
  try {
    email = (await getSessionUser())?.email ?? null
  } catch {
    email = null
  }
  return keyForEmail(email) ?? null
}

/** A metered API key (sk-ant-api…) auths with x-api-key; a Claude subscription
 *  OAuth token (sk-ant-oat…) uses Bearer + the oauth beta header. */
export function makeAnthropicClient(credential: string): Anthropic {
  if (credential.startsWith('sk-ant-oat')) {
    return new Anthropic({
      apiKey: null,
      authToken: credential,
      defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' },
    })
  }
  return new Anthropic({ apiKey: credential })
}
