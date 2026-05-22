'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Props {
  slug: string
  name: string
  url: string
  description: string
  total: number
  weekCount: number
  uniqueVisitors: number
  topCountry: string | null
  lastVisit: string | null
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function MiniStat({ label, value, highlight, wide }: { label: string; value: string | number; highlight?: boolean; wide?: boolean }) {
  return (
    <div style={{ background: '#111', padding: '16px 18px', gridColumn: wide ? 'span 2' : undefined }}>
      <p style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', margin: '0 0 6px' }}>
        {label}
      </p>
      <p style={{ fontSize: '22px', fontWeight: 300, letterSpacing: '-0.02em', margin: 0, color: highlight ? '#f5f5f5' : '#888' }}>
        {value}
      </p>
    </div>
  )
}

export default function ProjectCard({ slug, name, url, description, total, weekCount, uniqueVisitors, topCountry, lastVisit }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/admin/projects/analytics/${slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '14px',
          padding: '32px',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-0.018em', margin: 0 }}>
              {name}
            </h2>
            <span style={{ fontSize: '11px', color: '#444', fontFamily: 'ui-monospace, monospace', marginTop: '3px', flexShrink: 0 }}>
              {lastVisit ? timeAgo(lastVisit) : 'no visits yet'}
            </span>
          </div>
          <p style={{ marginTop: '4px', fontSize: '12px', color: '#555', fontFamily: 'ui-monospace, monospace' }}>
            {url}
          </p>
          <p style={{ marginTop: '6px', fontSize: '13px', color: '#666' }}>
            {description}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
          <MiniStat label="Unique visitors" value={uniqueVisitors} highlight={uniqueVisitors > 0} />
          <MiniStat label="Total views" value={total} />
          <MiniStat label="This week" value={weekCount} highlight={weekCount > 0} />
          <MiniStat label="Top country" value={topCountry ?? '—'} />
        </div>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '12px', color: '#555' }}>
          <span>View insights</span>
          <span style={{ fontSize: '14px' }}>→</span>
        </div>
      </div>
    </Link>
  )
}
