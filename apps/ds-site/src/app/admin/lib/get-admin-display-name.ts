import { getSessionUser, getSupabaseServerClient } from './supabase-server'

// The two founders go by short names; anyone else falls back to a capitalised username.
const DISPLAY: Record<string, string> = { dimitris: 'Dath', stelios: 'Stel' }

function pretty(username: string): string {
  return username ? username.charAt(0).toUpperCase() + username.slice(1) : ''
}

/** The logged-in admin's friendly first name, for the dashboard greeting. */
export async function getAdminDisplayName(): Promise<string> {
  const user = await getSessionUser()
  if (!user?.id) return 'there'
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('admin_users')
    .select('username')
    .eq('auth_user_id', user.id)
    .maybeSingle<{ username: string }>()
  const username = typeof data?.username === 'string' ? data.username : ''
  return DISPLAY[username] ?? (pretty(username) || 'there')
}
