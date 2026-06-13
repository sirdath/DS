'use client'

import { useState } from 'react'
import type {
  PanoptesStudy,
  PanoptesCandidate,
  PanoptesRecommendation,
  MetricKey,
} from './types'
import { METRIC_OPTIONS } from './types'

interface PanelProps {
  study: PanoptesStudy
  activeMetric: MetricKey
  onMetricChange: (m: MetricKey) => void
  showWhiteSpace: boolean
  onWhiteSpaceToggle: () => void
  onCandidateFly: (c: PanoptesCandidate) => void
  onRecommendationFly: (r: PanoptesRecommendation) => void
}

// ── Shared pillar bar ───────────────────────────────────────────────────────

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

// ── Candidate card ──────────────────────────────────────────────────────────

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

// ── Recommendation card ─────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  onClick,
}: {
  rec: PanoptesRecommendation
  onClick: () => void
}) {
  const topReasons = rec.reasons.slice(0, 3)
  return (
    <button
      type="button"
      className="pv-rec-card"
      onClick={onClick}
      aria-label={`Fly to recommendation ${rec.rank}: ${rec.area_name}`}
    >
      <div className="pv-rec-card__header">
        <span className="pv-rec-card__rank">#{rec.rank}</span>
        <span className="pv-rec-card__name">{rec.area_name}</span>
        <span className="pv-rec-card__score">{Math.round(rec.score)}</span>
      </div>

      <div className="pv-rec-card__meta">
        {rec.white_space && (
          <span className="pv-rec-card__ws-chip">white-space</span>
        )}
        <span className="pv-rec-card__zone">{rec.zone_label}</span>
      </div>

      <div className="pv-pillar-bars">
        <PillarBar label="Demand" value={rec.demand} />
        <PillarBar label="Comp" value={rec.competition} />
        <PillarBar label="Access" value={rec.access} />
      </div>

      {topReasons.length > 0 && (
        <ul className="pv-rec-card__reasons">
          {topReasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </button>
  )
}

// ── Moran's I readout ───────────────────────────────────────────────────────

function MoransReadout({ i, p }: { i: number; p: number }) {
  const significant = i > 0.1 && p < 0.05
  return (
    <div className="pv-morans">
      <span className="pv-morans__label">Spatial clustering</span>
      <span className="pv-morans__value">
        I&thinsp;=&thinsp;{i.toFixed(3)}
      </span>
      <span className={`pv-morans__verdict${significant ? '' : ' pv-morans__verdict--weak'}`}>
        {significant ? 'location matters' : 'weak — site choice matters less'}
      </span>
    </div>
  )
}

// ── Panel ───────────────────────────────────────────────────────────────────

export function Panel({
  study,
  activeMetric,
  onMetricChange,
  showWhiteSpace,
  onWhiteSpaceToggle,
  onCandidateFly,
  onRecommendationFly,
}: PanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sortedCandidates = [...study.candidates].sort(
    (a, b) => b.score.total - a.score.total
  )

  const topCompanions = [...study.companions]
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 8)

  const recommendations = study.recommendations ?? []

  const formatCategory = (cat: string) => cat.replace(/_/g, ' ')

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

        <div className="pv-panel__badges">
          <span
            className={`pv-mode-badge pv-mode-badge--${study.mode}`}
            aria-label={`Mode: ${study.mode}`}
          >
            {study.mode === 'data' ? 'Data mode' : 'Advanced'}
          </span>
          {study.sector !== undefined && (
            <span className="pv-sector-chip" aria-label={`Sector: ${study.sector}`}>
              SECTOR · {study.sector.toUpperCase()}
            </span>
          )}
        </div>

        {study.morans_i !== undefined && study.morans_p !== undefined && (
          <MoransReadout i={study.morans_i} p={study.morans_p} />
        )}
      </div>

      {/* Scrollable body */}
      <div className="pv-panel__body">
        {/* Recommended areas — shown ABOVE metric toggle */}
        {recommendations.length > 0 && (
          <div className="pv-panel__section">
            <div className="pv-section-label">
              Recommended areas ({recommendations.length})
            </div>
            <div className="pv-rec-list">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.rank}
                  rec={rec}
                  onClick={() => onRecommendationFly(rec)}
                />
              ))}
            </div>
          </div>
        )}

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
