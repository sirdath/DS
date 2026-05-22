'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'

const TZ_OPTIONS = [
  { label: 'London', value: 'Europe/London' },
  { label: 'Athens', value: 'Europe/Athens' },
]

function formatDisplay(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toYMD(date: Date) {
  return date.toLocaleDateString('en-CA')
}

function fromYMD(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export default function FilterBar({ initialTz, activeGroup }: { initialTz: string; activeGroup: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const [range, setRange] = useState<DateRange | undefined>(
    fromParam ? { from: fromYMD(fromParam), to: toParam ? fromYMD(toParam) : undefined } : undefined,
  )
  const [tz, setTz] = useState(searchParams.get('tz') ?? initialTz)
  const [group, setGroup] = useState<string | null>(activeGroup)
  const [calOpen, setCalOpen] = useState(false)
  const [btnState, setBtnState] = useState<'idle' | 'applied'>('idle')
  const calRef = useRef<HTMLDivElement>(null)

  // Close calendar on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const apply = useCallback(() => {
    const params = new URLSearchParams()
    if (range?.from) params.set('from', toYMD(range.from))
    if (range?.to) params.set('to', toYMD(range.to))
    params.set('tz', tz)
    if (group) params.set('group', group)
    router.replace(`${pathname}?${params.toString()}`)
    setCalOpen(false)
    setBtnState('applied')
    setTimeout(() => setBtnState('idle'), 1800)
  }, [range, tz, group, pathname, router])

  const reset = useCallback(() => {
    setRange(undefined)
    setTz('Europe/London')
    setGroup(null)
    router.replace(pathname)
    setBtnState('idle')
  }, [pathname, router])

  const rangeLabel = range?.from
    ? range.to
      ? `${formatDisplay(range.from)} – ${formatDisplay(range.to)}`
      : `${formatDisplay(range.from)} – …`
    : 'All time'

  const isDirty = range?.from || tz !== 'Europe/London' || group

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', position: 'relative' }}>

      {/* Timezone toggle */}
      <div style={{ display: 'flex', background: '#111', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TZ_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setTz(opt.value)}
            style={{
              padding: '7px 14px',
              background: tz === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: tz === opt.value ? '#f5f5f5' : '#555',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date range trigger */}
      <div ref={calRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setCalOpen(v => !v)}
          style={{
            padding: '7px 14px',
            background: calOpen ? 'rgba(255,255,255,0.1)' : '#111',
            border: `1px solid ${range?.from ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '6px',
            color: range?.from ? '#a5b4fc' : '#555',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {rangeLabel}
        </button>

        {calOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 100,
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <style>{`
              .rdp-root {
                --rdp-accent-color: #6366f1;
                --rdp-accent-background-color: rgba(99,102,241,0.15);
                --rdp-day-height: 36px;
                --rdp-day-width: 36px;
                --rdp-day_button-height: 34px;
                --rdp-day_button-width: 34px;
                --rdp-selected-border: 2px solid #6366f1;
                color: #ccc;
                font-family: ui-monospace, monospace;
                font-size: 12px;
              }
              .rdp-day_button:hover { background: rgba(255,255,255,0.07); border-radius: 6px; }
              .rdp-selected .rdp-day_button { background: #6366f1 !important; color: #fff; border-radius: 6px; }
              .rdp-range_middle .rdp-day_button { background: rgba(99,102,241,0.15) !important; border-radius: 0; }
              .rdp-range_start .rdp-day_button, .rdp-range_end .rdp-day_button { background: #6366f1 !important; color: #fff; border-radius: 6px; }
              .rdp-chevron { fill: #555; }
              .rdp-month_caption { color: #f5f5f5; font-size: 13px; }
              .rdp-weekday { color: #444; }
              .rdp-today:not(.rdp-selected) .rdp-day_button { color: #a5b4fc; }
            `}</style>
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { setRange(undefined); }}
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: '#555', fontSize: '11px', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
              >
                Clear
              </button>
              <button
                onClick={apply}
                style={{ padding: '6px 14px', background: '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Group filter */}
      <div style={{ display: 'flex', background: '#111', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { label: 'All', value: null, activeColor: '#f5f5f5', activeBg: 'rgba(255,255,255,0.1)' },
          { label: 'Leads', value: 'leads', activeColor: '#a78bfa', activeBg: 'rgba(99,102,241,0.2)' },
          { label: 'Admins', value: 'admins', activeColor: '#4ade80', activeBg: 'rgba(74,222,128,0.12)' },
        ].map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => setGroup(opt.value)}
            style={{
              padding: '7px 14px',
              background: group === opt.value ? opt.activeBg : 'transparent',
              border: 'none',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              color: group === opt.value ? opt.activeColor : '#555',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Apply button with feedback */}
      <button
        onClick={apply}
        style={{
          padding: '7px 16px',
          background: btnState === 'applied' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${btnState === 'applied' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: '6px',
          color: btnState === 'applied' ? '#a5b4fc' : '#f5f5f5',
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
          letterSpacing: '0.06em',
          cursor: 'pointer',
          transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          transform: btnState === 'applied' ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        {btnState === 'applied' ? '✓ Applied' : 'Apply'}
      </button>

      {isDirty && (
        <button
          onClick={reset}
          style={{
            padding: '7px 14px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '6px',
            color: '#555',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      )}
    </div>
  )
}
