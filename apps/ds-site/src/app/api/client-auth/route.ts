import { NextResponse } from 'next/server'

const AUTH_COOKIE = 'megagym_auth'
const AUTH_VALUE = 'ds2-mgym-v1'
const CLIENT_COOKIE = 'mgym_client'

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

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  }

  res.cookies.set(AUTH_COOKIE, AUTH_VALUE, cookieOpts)
  res.cookies.set(CLIENT_COOKIE, match.id, cookieOpts)

  return res
}
