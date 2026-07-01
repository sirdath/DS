'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearCredential, type CredentialStatus, saveCredential } from '@/app/admin/admin-key-actions'

const KIND_LABEL: Record<string, string> = {
  api: 'metered API key',
  oauth: 'subscription token',
  other: 'credential',
}

export function CredentialCard({ status }: { status: CredentialStatus }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!value.trim() || busy) return
    setBusy(true)
    setErr(null)
    try {
      await saveCredential(value)
      setValue('')
      router.refresh()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  async function onRemove() {
    if (!window.confirm('Remove your Anthropic credential? The scan will stop working until you add one.')) return
    setBusy(true)
    setErr(null)
    try {
      await clearCredential()
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not remove.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ds-card cmp-cred">
      <div className="cmp-cred__head">
        <span className="ds-card__title">Your Anthropic key</span>
        {status.set ? (
          <span className="ds-badge ds-badge--success" translate="no">
            {status.masked} · {KIND_LABEL[status.kind ?? 'other']}
          </span>
        ) : (
          <span className="ds-badge ds-badge--warning">Not set — scan disabled</span>
        )}
      </div>
      <p className="cmp-cred__hint">
        Powers the scan and bills to you. Paste an Anthropic API key (sk-ant-api…) or a Claude subscription token
        (sk-ant-oat…). Stored on your admin account only, never shown again in full.
      </p>
      <form className="cmp-cred__form" onSubmit={onSave}>
        <input
          className="ds-input"
          type="password"
          placeholder={status.set ? 'Paste a new key to replace…' : 'sk-ant-…'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-label="Anthropic credential"
        />
        <button className="ds-btn ds-btn--primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : status.set ? 'Replace' : 'Save key'}
        </button>
        {status.set ? (
          <button type="button" className="ds-btn ds-btn--ghost" onClick={onRemove} disabled={busy}>
            Remove
          </button>
        ) : null}
      </form>
      {err ? (
        <p className="cmp-err" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  )
}
