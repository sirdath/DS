'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

type State =
  | { kind: 'idle' }
  | { kind: 'working'; label: string }
  | { kind: 'done'; invoices: number; customers: number; warnings: string[] }
  | { kind: 'error'; message: string }

const CSV_MAX = 2_000_000

export function ImportPanel() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onFile(file: File) {
    if (file.size > CSV_MAX) {
      setState({ kind: 'error', message: 'That file is over 2 MB, export a smaller range.' })
      return
    }
    setState({ kind: 'working', label: 'Reading file…' })
    const csv = await file.text()

    setState({ kind: 'working', label: 'Importing invoices…' })
    const res = await fetch('/api/plutus/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      invoices?: number
      customers?: number
      warnings?: string[]
      error?: string
    }
    if (!res.ok) {
      setState({ kind: 'error', message: data.error ?? 'Import failed.' })
      return
    }

    // Run the first cycle so the chase list + queue populate immediately. A cycle
    // failure must not read as a clean import — surface it as a warning.
    setState({ kind: 'working', label: 'Scoring & scheduling…' })
    const warnings = data.warnings ?? []
    try {
      const cycleRes = await fetch('/api/plutus/cycle', { method: 'POST' })
      if (!cycleRes.ok) warnings.push('Imported, but the first scoring cycle failed — open the queue and run it again.')
    } catch {
      warnings.push('Imported, but the first scoring cycle failed — open the queue and run it again.')
    }

    setState({
      kind: 'done',
      invoices: data.invoices ?? 0,
      customers: data.customers ?? 0,
      warnings,
    })
    router.refresh()
  }

  const busy = state.kind === 'working'

  return (
    <section className="wp-card wp-import">
      <h3 className="wp-h3">Import your receivables</h3>
      <p className="wp-import__lead">
        Drop a CSV export from any accounting system, invoice number, customer, amount, issue &amp; due date. We map
        the columns, parse Greek or English number formats, and skip rows we can&rsquo;t read.
      </p>

      <div className="wp-import__row">
        <label className="wp-btn is-approve wp-import__btn" aria-busy={busy}>
          Choose CSV file
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="wp-import__input"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onFile(file)
              e.target.value = ''
            }}
          />
        </label>
        {busy ? (
          <span className="wp-import__status" aria-live="polite">
            {state.label}
          </span>
        ) : null}
      </div>

      <div aria-live="polite">
        {state.kind === 'done' ? (
          <div className="wp-import__result">
            <p className="wp-import__ok">
              ✓ Imported {state.invoices} invoice{state.invoices === 1 ? '' : 's'} across {state.customers} customer
              {state.customers === 1 ? '' : 's'}.
            </p>
            {state.warnings.length ? (
              <details className="wp-import__warn">
                <summary>{state.warnings.length} row(s) skipped or flagged</summary>
                <ul>
                  {state.warnings.slice(0, 20).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
        {state.kind === 'error' ? <p className="wp-import__err">{state.message}</p> : null}
      </div>
    </section>
  )
}
