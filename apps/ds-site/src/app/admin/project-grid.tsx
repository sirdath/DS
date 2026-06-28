'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Project, ProjectStatus } from './types'
import { STATUS_LABELS, PROJECT_TYPE_LABELS } from './types'
import { outstanding, isOverdue } from './lib/derive'
import { siteForProject } from './lib/sites'
import { formatMoney } from './format'
import { useStaggerIn } from './use-stagger-in'

interface Props {
  projects: Project[]
}

export function ProjectGrid({ projects }: Props) {
  const gridRef = useStaggerIn<HTMLDivElement>()

  // Progress sweep: animate fills from 0 -> final width after card stagger
  useEffect(() => {
    const root = gridRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const fills = root.querySelectorAll<HTMLElement>('.admin-progress__fill')
    // Delay slightly so fill sweeps AFTER the card fade-up (stagger is 0.05 * n)
    const delay = 0.5 + fills.length * 0.05

    const ctx = gsap.context(() => {
      fills.forEach((fill) => {
        const target = fill.style.width
        fill.style.width = '0%'
        gsap.to(fill, {
          width: target,
          duration: 0.8,
          ease: 'power2.out',
          delay,
        })
      })
    }, root)

    return () => ctx.revert()
  }, [projects, gridRef])

  if (projects.length === 0) {
    return (
      <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', padding: '40px 0' }}>
        No projects match this filter.
      </p>
    )
  }

  return (
    <div className="admin-grid" ref={gridRef}>
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  )
}

function ProjectCard({ project: p }: { project: Project }) {
  const owed = outstanding(p)
  const overdue = isOverdue(p)
  const site = siteForProject(p)
  const cardRef = useRef<HTMLAnchorElement>(null)
  const glowXSetter = useRef<ReturnType<typeof gsap.quickTo> | null>(null)
  const glowYSetter = useRef<ReturnType<typeof gsap.quickTo> | null>(null)

  // Set up quickTo setters for glow position and GSAP hover lift
  useEffect(() => {
    const el: HTMLAnchorElement | null = cardRef.current
    if (el === null) return
    const safeEl: HTMLAnchorElement = el
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Glow position smoothing via quickTo on CSS vars
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
      gsap.to(safeEl, {
        y: -3,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    function onPointerLeave() {
      gsap.to(safeEl, {
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      // Reset glow to center
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

  const isRetainer = p.status === 'retainer'

  return (
    <div className="admin-card-wrapper" data-stagger>
      <Link
        href={`/admin/project/${p.id}`}
        className={`admin-card${isRetainer ? ' is-retainer' : ''}`}
        ref={cardRef}
      >
        <div className="admin-card__header">
          <div>
            <div className="admin-card__name">{p.name}</div>
            <div className="admin-card__lead">
              <span className="admin-type-tag" style={{ marginRight: 6 }}>
                {PROJECT_TYPE_LABELS[p.projectType]}
              </span>
              {p.lead}
            </div>
          </div>
          <div className="admin-card__header-right">
            {isRetainer && p.retainerMonthly !== null && (
              <span className="admin-retainer-badge">
                €{p.retainerMonthly}/mo
              </span>
            )}
            <StatusPill status={p.status} />
          </div>
        </div>

        <ProgressBar pct={p.completionPct} status={p.status} />

        <div className="admin-card__money">
          <span className="admin-card__money-paid">{formatMoney(p.amountPaid)} paid</span>
          <span>/</span>
          <span>{formatMoney(owed)} outstanding</span>
        </div>

        {overdue && (
          <div className="admin-card__meta">
            <span className="admin-overdue">Overdue</span>
          </div>
        )}
      </Link>

      {/* Footer links — siblings of the card Link so they don't nest anchors */}
      {(site || p.repoUrl) && (
        <div className="admin-card__footer">
          {site && (
            <a
              href={`/admin/open/${site.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-open-link"
              title={`Open ${site.name} as admin, no password`}
            >
              Open site &#8599;
            </a>
          )}
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-repo-link"
            >
              Repo &#8599;
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span className={`admin-status-pill is-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function ProgressBar({ pct, status }: { pct: number; status: ProjectStatus }) {
  const label = `${pct}%`
  return (
    <div className="admin-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Completion: ${label}`}>
      <div className="admin-progress__track">
        <div
          className="admin-progress__fill"
          style={{ width: `${pct}%` }}
          data-status={status}
        />
      </div>
      <span className="admin-progress__label">{label}</span>
    </div>
  )
}
