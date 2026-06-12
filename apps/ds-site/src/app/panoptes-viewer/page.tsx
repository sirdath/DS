'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import './viewer.css'
import type { PanoptesStudy, PanoptesCandidate, MetricKey } from './types'
import { Panel } from './panel'
import { MapView } from './map'

// ── Types ──────────────────────────────────────────────────────────────────

interface HexTooltipData {
  h3Id: string
  demand: number
  competition: number
  access: number
  total: number
  population: number
  targetCount: number
  opportunity: number | null
  adjustments: Array<{ name: string; points: number }>
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  data: HexTooltipData | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidStudy(v: unknown): v is PanoptesStudy {
  if (typeof v !== 'object' || v === null) return false
  const obj = v as Record<string, unknown>
  return (
    typeof obj['study'] === 'string' &&
    (obj['mode'] === 'data' || obj['mode'] === 'advanced') &&
    typeof obj['generated_by'] === 'string' &&
    Array.isArray(obj['hexes']) &&
    Array.isArray(obj['candidates']) &&
    Array.isArray(obj['companions']) &&
    Array.isArray(obj['opportunities'])
  )
}

function parseStudyFile(text: string): PanoptesStudy | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (isValidStudy(parsed)) return parsed
    return null
  } catch {
    return null
  }
}

// ── Tooltip component ──────────────────────────────────────────────────────

function HexTooltip({ state }: { state: TooltipState }) {
  if (!state.visible || !state.data) return null
  const d = state.data

  // Position tooltip so it doesn't overflow viewport edges
  const OFFSET_X = 14
  const OFFSET_Y = 14
  const tipW = 240
  const tipH = 260

  const x =
    state.x + OFFSET_X + tipW > window.innerWidth
      ? state.x - tipW - OFFSET_X
      : state.x + OFFSET_X

  const y =
    state.y + OFFSET_Y + tipH > window.innerHeight
      ? state.y - tipH - OFFSET_Y
      : state.y + OFFSET_Y

  return (
    <div
      className="pv-tooltip"
      style={{ left: x, top: y }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="pv-tooltip__h3">{d.h3Id}</div>

      <div className="pv-tooltip__row">
        <span className="pv-tooltip__label">Total</span>
        <span className="pv-tooltip__val pv-tooltip__val--highlight">
          {d.total.toFixed(1)}
        </span>
      </div>
      <div className="pv-tooltip__row">
        <span className="pv-tooltip__label">Demand</span>
        <span className="pv-tooltip__val">{d.demand.toFixed(1)}</span>
      </div>
      <div className="pv-tooltip__row">
        <span className="pv-tooltip__label">Competition</span>
        <span className="pv-tooltip__val">{d.competition.toFixed(1)}</span>
      </div>
      <div className="pv-tooltip__row">
        <span className="pv-tooltip__label">Access</span>
        <span className="pv-tooltip__val">{d.access.toFixed(1)}</span>
      </div>

      <div className="pv-tooltip__divider" />

      <div className="pv-tooltip__row">
        <span className="pv-tooltip__label">Population</span>
        <span className="pv-tooltip__val">
          {d.population.toLocaleString('en-US')}
        </span>
      </div>
      <div className="pv-tooltip__row">
        <span className="pv-tooltip__label">Rivals</span>
        <span className="pv-tooltip__val">{d.targetCount}</span>
      </div>

      {d.opportunity !== null && (
        <div className="pv-tooltip__row">
          <span className="pv-tooltip__label">Opportunity</span>
          <span className="pv-tooltip__val">
            {d.opportunity >= 0 ? '+' : ''}
            {d.opportunity.toFixed(1)}
          </span>
        </div>
      )}

      {d.adjustments.length > 0 && (
        <>
          <div className="pv-tooltip__divider" />
          <div className="pv-tooltip__adj-label">Analyst adjustments</div>
          {d.adjustments.map((adj, i) => (
            <div key={i} className="pv-tooltip__row">
              <span className="pv-tooltip__label">analyst: {adj.name}</span>
              <span className="pv-tooltip__val">
                {adj.points >= 0 ? '+' : ''}
                {adj.points}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onFileLoad: (study: PanoptesStudy) => void
  error: string | null
}

function EmptyState({ onFileLoad, error }: EmptyStateProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text !== 'string') return
        const study = parseStudyFile(text)
        if (study) {
          onFileLoad(study)
        }
      }
      reader.readAsText(file)
    },
    [onFileLoad]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="pv-empty" role="main">
      <div className="pv-empty__card">
        <div className="pv-empty__eyebrow">DS · Panoptes</div>
        <h1 className="pv-empty__title">Site-selection viewer</h1>
        <p className="pv-empty__sub">
          Load a Panoptes study JSON to explore hex-level demand, competition,
          and access signals on an interactive map.
        </p>

        <div
          className={`pv-dropzone${isDragging ? ' is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <svg
            className="pv-dropzone__icon"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="10"
              width="32"
              height="24"
              rx="4"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M20 6v16M14 12l6-6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="pv-dropzone__label">
            <strong>Drop a study .json</strong> here, or click to browse
          </p>

          {error && (
            <p
              style={{ color: '#f87171', fontSize: '12px', margin: '0' }}
              role="alert"
            >
              {error}
            </p>
          )}

          <label>
            <span className="pv-dropzone__btn" role="button" tabIndex={0}>
              Choose file
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="pv-dropzone__file-input"
              onChange={handleInputChange}
              aria-label="Choose a Panoptes study JSON file"
            />
          </label>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function PanoptesViewerPage() {
  const [study, setStudy] = useState<PanoptesStudy | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeMetric, setActiveMetric] = useState<MetricKey>('total')
  const [showWhiteSpace, setShowWhiteSpace] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
  })
  const [flyToTrigger, setFlyToTrigger] = useState<PanoptesCandidate | null>(
    null
  )

  const handleFileLoad = useCallback((loaded: PanoptesStudy) => {
    setLoadError(null)
    setStudy(loaded)
    setActiveMetric('total')
    setShowWhiteSpace(false)
  }, [])

  const handleMetricChange = useCallback((m: MetricKey) => {
    setActiveMetric(m)
    // Auto-enable white-space overlay when selecting opportunity
    if (m === 'opportunity') setShowWhiteSpace(true)
  }, [])

  const handleWhiteSpaceToggle = useCallback(() => {
    setShowWhiteSpace((v) => !v)
  }, [])

  const handleCandidateFly = useCallback((c: PanoptesCandidate) => {
    // Use object identity change to re-trigger even for the same candidate
    setFlyToTrigger({ ...c })
  }, [])

  // Global drag-over on the viewer (after study loaded) — ignore
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault()
    document.addEventListener('dragover', prevent)
    document.addEventListener('drop', prevent)
    return () => {
      document.removeEventListener('dragover', prevent)
      document.removeEventListener('drop', prevent)
    }
  }, [])

  return (
    <div className="pv-shell">
      {study === null ? (
        <EmptyState onFileLoad={handleFileLoad} error={loadError} />
      ) : (
        <>
          <MapView
            study={study}
            activeMetric={activeMetric}
            showWhiteSpace={showWhiteSpace}
            onTooltipChange={setTooltip}
            flyToTrigger={flyToTrigger}
          />
          <Panel
            study={study}
            activeMetric={activeMetric}
            onMetricChange={handleMetricChange}
            showWhiteSpace={showWhiteSpace}
            onWhiteSpaceToggle={handleWhiteSpaceToggle}
            onCandidateFly={handleCandidateFly}
          />
          <HexTooltip state={tooltip} />
        </>
      )}
    </div>
  )
}
