'use client'

import { useState } from 'react'
import type { PanoptesStudy, PanoptesCandidate, MetricKey } from './types'
import { METRIC_OPTIONS } from './types'

interface PanelProps {
  study: PanoptesStudy
  activeMetric: MetricKey
  onMetricChange: (m: MetricKey) => void
  showWhiteSpace: boolean
  onWhiteSpaceToggle: () => void
  onCandidateFly: (c: PanoptesCandidate) => void
}

function PillarBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="pv-pillar-row">
      <span className="pv-pillar-row__label">{label}</span>
      <div className="pv-pillar-row__track">
        <div className="pv-pillar-row__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="pv-pillar-row__val">{value.toFixed(1)}</span>
    </div>
  )
}

function CandidateCard({
  candidate,
  rank,
  onClick,
}: {
  candidate: PanoptesCandidate
  rank: number
  onClick: () => void
}) {
  const s = candidate.score
  return (
    <button
      type="button"
      className="pv-candidate-card"
      onClick={onClick}
      aria-label={`Fly to ${candidate.name}`}
    >
      <div className="pv-candidate-card__header">
        <span className="pv-candidate-card__rank">#{rank}</span>
        <span className="pv-candidate-card__name">{candidate.name}</span>
        <span className="pv-candidate-card__score">{s.total.toFixed(1)}</span>
      </div>
      <div className="pv-pillar-bars">
        <PillarBar label="Demand" value={s.demand} />
        <PillarBar label="Comp" value={s.competition} />
        <PillarBar label="Access" value={s.access} />
      </div>
    </button>
  )
}

export function Panel({
  study,
  activeMetric,
  onMetricChange,
  showWhiteSpace,
  onWhiteSpaceToggle,
  onCandidateFly,
}: PanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Sort candidates by total score descending
  const sortedCandidates = [...study.candidates].sort(
    (a, b) => b.score.total - a.score.total
  )

  // Top 8 companions by lift
  const topCompanions = [...study.companions]
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 8)

  const formatCategory = (cat: string) =>
    cat.replace(/_/g, ' ')

  return (
    <aside
      className={`pv-panel${isCollapsed ? ' is-collapsed' : ''}`}
      aria-label="Study panel"
    >
      {/* Mobile handle */}
      <div
        className="pv-panel__handle"
        role="button"
        tabIndex={0}
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        onClick={() => setIsCollapsed((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsCollapsed((v) => !v)
        }}
      >
        <div className="pv-panel__handle-bar" />
      </div>

      {/* Header */}
      <div className="pv-panel__head">
        <div className="pv-panel__eyebrow">Panoptes</div>
        <div className="pv-panel__title">{study.study}</div>
        <span
          className={`pv-mode-badge pv-mode-badge--${study.mode}`}
          aria-label={`Mode: ${study.mode}`}
        >
          {study.mode === 'data' ? 'Data mode' : 'Advanced'}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="pv-panel__body">
        {/* Metric toggle */}
        <div className="pv-panel__section">
          <div className="pv-section-label">Metric</div>
          <div
            className="pv-metric-toggle"
            role="group"
            aria-label="Select map metric"
          >
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`pv-metric-btn${activeMetric === opt.key ? ' is-active' : ''}`}
                onClick={() => onMetricChange(opt.key)}
                aria-pressed={activeMetric === opt.key}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* White-space toggle — always shown, not just in opportunity mode */}
          <div
            role="checkbox"
            aria-checked={showWhiteSpace}
            tabIndex={0}
            className={`pv-ws-toggle${showWhiteSpace ? ' is-on' : ''}`}
            onClick={onWhiteSpaceToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onWhiteSpaceToggle()
            }}
          >
            <div className="pv-ws-toggle__check" aria-hidden="true">
              {showWhiteSpace && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2.5 2.5L8 3"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="pv-ws-toggle__label">Show white-space hexes</span>
          </div>
        </div>

        {/* Candidate list */}
        {sortedCandidates.length > 0 && (
          <div className="pv-panel__section">
            <div className="pv-section-label">
              Candidates ({sortedCandidates.length})
            </div>
            <div className="pv-candidate-list">
              {sortedCandidates.map((c, i) => (
                <CandidateCard
                  key={c.name}
                  candidate={c}
                  rank={i + 1}
                  onClick={() => onCandidateFly(c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Companions table */}
        {topCompanions.length > 0 && (
          <div className="pv-panel__section">
            <div className="pv-section-label">
              Co-location lift (top {topCompanions.length})
            </div>
            <div className="pv-companions" role="table" aria-label="Companion categories">
              <div className="pv-companions__header" role="row">
                <span className="pv-companions__th" role="columnheader">Category</span>
                <span className="pv-companions__th" role="columnheader">Lift</span>
                <span className="pv-companions__th" role="columnheader">n</span>
              </div>
              {topCompanions.map((comp) => (
                <div key={comp.category} className="pv-companions__row" role="row">
                  <span className="pv-companions__cat" title={formatCategory(comp.category)} role="cell">
                    {formatCategory(comp.category)}
                  </span>
                  <span className="pv-companions__lift" role="cell">
                    {comp.lift.toFixed(2)}×
                  </span>
                  <span className="pv-companions__support" role="cell">
                    {comp.support}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pv-panel__footer" aria-label="Attribution">
        <div className="pv-panel__footer-line">{study.generated_by}</div>
        <div className="pv-panel__footer-line">
          Data: Overture Maps · Eurostat census 2021 · AADE 2022
        </div>
      </div>
    </aside>
  )
}
