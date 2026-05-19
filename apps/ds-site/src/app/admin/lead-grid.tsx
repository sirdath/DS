'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Project, OutreachStage } from './types'
import { OUTREACH_LABELS } from './types'
import { formatMoney } from './format'
import { convertLeadAction, markLeadLostAction } from './actions'
import { useStaggerIn } from './use-stagger-in'

interface Props {
  leads: Project[]
}

export function LeadGrid({ leads }: Props) {
  const gridRef = useStaggerIn<HTMLDivElement>()

  if (leads.length === 0) {
    return (
      <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', padding: '20px 0' }}>
        No potential leads.
      </p>
    )
  }

  return (
    <div className="admin-grid" ref={gridRef}>
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  )
}

function LeadCard({ lead: p }: { lead: Project }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const glowXSetter = useRef<ReturnType<typeof gsap.quickTo> | null>(null)
  const glowYSetter = useRef<ReturnType<typeof gsap.quickTo> | null>(null)

  useEffect(() => {
    const el: HTMLAnchorElement | null = cardRef.current
    if (el === null) return
    const safeEl: HTMLAnchorElement = el
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    glowXSetter.current = gsap.quickTo(safeEl, '--card-mx', { duration: 0.4, ease: 'power2.out' })
    glowYSetter.current = gsap.quickTo(safeEl, '--card-my', { duration: 0.4, ease: 'power2.out' })

    function onPointerMove(e: PointerEvent) {
      const rect = safeEl.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      glowXSetter.current?.(x)
      glowYSetter.current?.(y)
    }

    function onPointerEnter() {
      gsap.to(safeEl, { y: -3, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
    }

    function onPointerLeave() {
      gsap.to(safeEl, { y: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })
      glowXSetter.current?.(50)
      glowYSetter.current?.(50)
    }

    safeEl.addEventListener('pointermove', onPointerMove)
    safeEl.addEventListener('pointerenter', onPointerEnter)
    safeEl.addEventListener('pointerleave', onPointerLeave)

    return () => {
      safeEl.removeEventListener('pointermove', onPointerMove)
      safeEl.removeEventListener('pointerenter', onPointerEnter)
      safeEl.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  const stage: OutreachStage = p.outreachStage ?? 'identified'
  const stageLabel = OUTREACH_LABELS[stage]
  const convertBound = convertLeadAction.bind(null, p.id)
  const lostBound = markLeadLostAction.bind(null, p.id)

  return (
    <div className="admin-lead-wrapper" data-stagger>
      {/* Card body — full clickable link, excludes action footer */}
      <Link
        href={`/admin/project/${p.id}`}
        className={`admin-card admin-lead-card`}
        ref={cardRef}
      >
        <div className="admin-card__header">
          <div>
            <div className="admin-card__name">{p.name}</div>
            <div className="admin-card__lead">{p.lead}</div>
          </div>
          <OutreachPill stage={stage} label={stageLabel} />
        </div>

        <div className="admin-lead-card__body">
          {p.whyThem && (
            <p className="admin-lead-card__why">{p.whyThem}</p>
          )}

          <div className="admin-lead-card__meta">
            {p.estimatedValue !== null && (
              <span className="admin-lead-card__meta-item">
                <span className="admin-lead-card__meta-label">Est. value</span>
                <span className="admin-lead-card__meta-value">{formatMoney(p.estimatedValue)}</span>
              </span>
            )}
            {p.source && (
              <span className="admin-lead-card__meta-item">
                <span className="admin-lead-card__meta-label">Source</span>
                <span className="admin-lead-card__meta-value">{p.source}</span>
              </span>
            )}
          </div>

          {p.proposalUrl ? (
            <a
              href={p.proposalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-lead-card__demo-link"
              onClick={(e) => e.stopPropagation()}
            >
              View demo &#8599;
            </a>
          ) : stage === 'identified' ? (
            <span className="admin-lead-card__no-demo">No demo yet</span>
          ) : null}
        </div>
      </Link>

      {/* Action footer — sibling of the Link, not nested inside it */}
      <div className="admin-lead-card__actions">
        <form action={convertBound}>
          <button type="submit" className="admin-lead-card__btn admin-lead-card__btn--convert">
            Convert &#8594; Won
          </button>
        </form>
        <form action={lostBound}>
          <button type="submit" className="admin-lead-card__btn admin-lead-card__btn--lost">
            Mark lost
          </button>
        </form>
      </div>
    </div>
  )
}

function OutreachPill({ stage, label }: { stage: OutreachStage; label: string }) {
  return (
    <span className={`admin-outreach-pill is-${stage}`}>
      {label}
    </span>
  )
}
