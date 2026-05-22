import { NextResponse } from 'next/server'
import { AUTH_COOKIE, AUTH_VALUE, CLIENT_COOKIE, GATE_COOKIE_OPTS } from '../../admin/lib/client-gate'

interface PasswordEntry {
  id: string
  password: string
  redirect: string
}

function getPasswords(): PasswordEntry[] {
  // CLIENT_PASSWORDS is the canonical var; fall back to the legacy
  // MEGAGYM_PASSWORDS so nothing breaks before the env var is renamed.
  const raw = process.env.CLIENT_PASSWORDS ?? process.env.MEGAGYM_PASSWORDS ?? '[]'
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const passwords = getPasswords()
  const match = passwords.find(p => p.password === body.password)

  if (!match) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, redirect: match.redirect })
  res.cookies.set(AUTH_COOKIE, AUTH_VALUE, GATE_COOKIE_OPTS)
  res.cookies.set(CLIENT_COOKIE, match.id, GATE_COOKIE_OPTS)
  return res
}
