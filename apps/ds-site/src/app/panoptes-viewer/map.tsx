'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type {
  PanoptesStudy,
  PanoptesCandidate,
  PanoptesRecommendation,
  MetricKey,
} from './types'
import { METRIC_OPTIONS } from './types'
import { zoneColor } from './zones-palette'

// MapLibre + h3-js are loaded only client-side
import type maplibregl from 'maplibre-gl'

/**
 * MapLibre needs a WebGL context. Some browsers ship with hardware acceleration
 * off, a blocklisted GPU, or a privacy extension that disables WebGL — there the
 * map constructor throws and the canvas stays blank. Detect it up front so we can
 * show a real message + recovery path instead of an empty box (and so "works for
 * one person, blank for another" stops being a silent mystery).
 */
function detectWebGL(): boolean {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}

// ── Color ramp stops (ordered low → high) ─────────────────────────────────
const COLOR_STOPS = [
  '#1f2937',
  '#1e3a8a',
  '#1d4ed8',
  '#2563eb',
  '#22d3ee',
] as const

function buildColorExpression(
  metric: MetricKey,
  min: number,
  max: number,
): maplibregl.ExpressionSpecification {
  const prop = metric as string

  if (min === max) {
    return COLOR_STOPS[2] as unknown as maplibregl.ExpressionSpecification
  }

  const step = (max - min) / (COLOR_STOPS.length - 1)
  const stops: (number | string)[] = []
  COLOR_STOPS.forEach((color, i) => {
    stops.push(min + step * i, color)
  })

  return [
    'interpolate',
    ['linear'],
    ['get', prop],
    ...stops,
  ] as maplibregl.ExpressionSpecification
}

/** Build a categorical match expression for zones.
 *  zone_id is stored as a number on each GeoJSON feature (-1 = unassigned).
 *  ['match', ['get', 'zone_id'], 0, color0, 1, color1, ..., fallback]
 */
function buildZoneColorExpression(
  uniqueZoneIds: number[],
): maplibregl.ExpressionSpecification {
  const args: unknown[] = ['match', ['get', 'zone_id']]
  for (const id of uniqueZoneIds) {
    args.push(id, zoneColor(id))
  }
  // transparent fallback for unassigned hexes (zone_id = -1)
  args.push('rgba(30,30,35,0.0)')
  return args as unknown as maplibregl.ExpressionSpecification
}

type NumericHexMetric = 'demand' | 'competition' | 'access' | 'total'

function computeMetricRange(
  study: PanoptesStudy,
  metric: MetricKey,
): { min: number; max: number } {
  if (metric === 'zones') return { min: 0, max: 1 }

  const values: number[] =
    metric === 'opportunity'
      ? study.opportunities.map((o) => o.opportunity)
      : study.hexes.map((h) => h[metric as NumericHexMetric])

  if (values.length === 0) return { min: 0, max: 1 }

  let min = values[0] ?? 0
  let max = values[0] ?? 0
  for (const v of values) {
    if (v < min) min = v
    if (v > max) max = v
  }
  return { min, max }
}

interface GeoJsonFeaturePolygon {
  type: 'Feature'
  geometry: {
    type: 'Polygon'
    coordinates: [number, number][][]
  }
  properties: Record<string, unknown>
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeaturePolygon[]
}

function hexToGeoJsonPolygon(
  h3: typeof import('h3-js'),
  h3Id: string,
  properties: Record<string, unknown>
): GeoJsonFeaturePolygon {
  const boundary = h3.cellToBoundary(h3Id)
  const coordinates = boundary.map(([lat, lng]) => [lng, lat] as [number, number])
  const first = coordinates[0]
  if (first) coordinates.push(first)

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coordinates] },
    properties,
  }
}

// ── Recommendation popup (React) ────────────────────────────────────────────

interface RecPopupState {
  visible: boolean
  x: number
  y: number
  rec: PanoptesRecommendation | null
}

function RecPopup({ state }: { state: RecPopupState }) {
  if (!state.visible || !state.rec) return null
  const r = state.rec

  const POP_W = 260
  const POP_H = 240
  const OFFSET = 16
  const x =
    state.x + OFFSET + POP_W > window.innerWidth
      ? state.x - POP_W - OFFSET
      : state.x + OFFSET
  const y =
    state.y + OFFSET + POP_H > window.innerHeight
      ? state.y - POP_H - OFFSET
      : state.y + OFFSET

  const topReasons = r.reasons.slice(0, 3)

  return (
    <div
      className="pv-rec-popup"
      style={{ left: x, top: y }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="pv-rec-popup__name">{r.area_name}</div>
      <div className="pv-rec-popup__score">
        Suitability <span>{Math.round(r.score)}/100</span>
      </div>
      {topReasons.length > 0 && (
        <ul className="pv-rec-popup__reasons">
          {topReasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Zone legend ─────────────────────────────────────────────────────────────

interface ZoneLegendEntry {
  zoneId: number
  label: string
  color: string
}

function ZoneLegend({ entries }: { entries: ZoneLegendEntry[] }) {
  return (
    <div className="pv-legend pv-legend--zones" role="img" aria-label="Zone legend">
      <div className="pv-legend__metric">Functional zones</div>
      <div className="pv-zone-list">
        {entries.map((e) => (
          <div key={e.zoneId} className="pv-zone-entry">
            <span
              className="pv-zone-entry__swatch"
              style={{ background: e.color }}
              aria-hidden="true"
            />
            <span className="pv-zone-entry__label">{e.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Numeric map legend ──────────────────────────────────────────────────────

interface MapLegendProps {
  metricLabel: string
  min: number
  max: number
  showWhiteSpaceHint: boolean
}

function MapLegend({ metricLabel, min, max, showWhiteSpaceHint }: MapLegendProps) {
  const fmt = (v: number) => {
    const abs = Math.abs(v)
    if (abs >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
    return v.toFixed(1)
  }

  return (
    <div className="pv-legend" role="img" aria-label={`Legend: ${metricLabel}`}>
      <div className="pv-legend__metric">{metricLabel}</div>
      <div className="pv-legend__bar-wrap">
        <div className="pv-legend__bar" />
        <div className="pv-legend__range">
          <span className="pv-legend__range-val">{fmt(min)}</span>
          <span className="pv-legend__range-val">{fmt(max)}</span>
        </div>
      </div>
      {showWhiteSpaceHint && (
        <div className="pv-legend__hint">
          <span className="pv-legend__hint-swatch" aria-hidden="true" />
          white-space hex
        </div>
      )}
    </div>
  )
}

// ── Tooltip types (re-exported shape for page.tsx) ──────────────────────────

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

// ── MapView props ───────────────────────────────────────────────────────────

interface MapViewProps {
  study: PanoptesStudy
  activeMetric: MetricKey
  showWhiteSpace: boolean
  onTooltipChange: (state: TooltipState) => void
  flyToTrigger: PanoptesCandidate | null
  flyToRec: PanoptesRecommendation | null
}

export function MapView({
  study,
  activeMetric,
  showWhiteSpace,
  onTooltipChange,
  flyToTrigger,
  flyToRec,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const recMarkersRef = useRef<maplibregl.Marker[]>([])
  const isInitializedRef = useRef(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [recPopup, setRecPopup] = useState<RecPopupState>({
    visible: false,
    x: 0,
    y: 0,
    rec: null,
  })

  // ── Build hex GeoJSON ────────────────────────────────────────────────────
  const buildHexGeoJSON = useCallback(
    async (h3Module: typeof import('h3-js')) => {
      const oppMap = new Map<string, { opportunity: number; white_space: boolean }>()
      for (const opp of study.opportunities) {
        oppMap.set(opp.h3_id, opp)
      }

      // h3_id → zone integer (-1 = unassigned)
      const zoneById = new Map<string, number>()
      for (const a of study.zones?.assignments ?? []) {
        zoneById.set(a.h3_id, a.zone)
      }

      const features: GeoJsonFeaturePolygon[] = []
      for (const hex of study.hexes) {
        const opp = oppMap.get(hex.h3_id)
        const zoneId = zoneById.get(hex.h3_id) ?? -1
        features.push(
          hexToGeoJsonPolygon(h3Module, hex.h3_id, {
            h3_id: hex.h3_id,
            demand: hex.demand,
            competition: hex.competition,
            access: hex.access,
            total: hex.total,
            population: hex.population,
            target_count: hex.target_count,
            complement_count: hex.complement_count,
            opportunity: opp?.opportunity ?? 0,
            white_space: opp?.white_space ?? false,
            adjustments_json: JSON.stringify(hex.adjustments),
            zone_id: zoneId,
          })
        )
      }

      return { type: 'FeatureCollection', features } as GeoJsonFeatureCollection
    },
    [study]
  )

  // ── Initialize map (runs once per study load) ────────────────────────────
  useEffect(() => {
    if (isInitializedRef.current || !containerRef.current) return
    isInitializedRef.current = true

    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    if (!detectWebGL()) {
      isInitializedRef.current = false
      setMapError(
        'This browser couldn’t start the map, WebGL appears to be unavailable. Turn on hardware acceleration (or disable a privacy/anti-fingerprint extension for this site), then reload. Chrome or Safari usually work out of the box.',
      )
      return
    }
    setMapError(null)

    void (async () => {
      try {
        const [maplibre, h3] = await Promise.all([
          import('maplibre-gl'),
          import('h3-js'),
        ])

        if (disposed || !containerRef.current) return

      let minLat = Infinity, maxLat = -Infinity
      let minLon = Infinity, maxLon = -Infinity
      for (const hex of study.hexes) {
        if (hex.lat < minLat) minLat = hex.lat
        if (hex.lat > maxLat) maxLat = hex.lat
        if (hex.lon < minLon) minLon = hex.lon
        if (hex.lon > maxLon) maxLon = hex.lon
      }

      const centerLat = (minLat + maxLat) / 2
      const centerLon = (minLon + maxLon) / 2

      const CARTO_ATTR =
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'

      const map = new maplibre.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: ['https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png'],
              tileSize: 256,
              attribution: CARTO_ATTR,
              maxzoom: 19,
            },
            'carto-labels': {
              type: 'raster',
              tiles: ['https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png'],
              tileSize: 256,
              attribution: CARTO_ATTR,
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: 'carto-dark-layer',
              type: 'raster',
              source: 'carto-dark',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
        center: [centerLon, centerLat],
        zoom: 13,
        attributionControl: {},
      })

      mapRef.current = map

      // Surface runtime failures (tile/style/network) for diagnosis without
      // tearing down a map that's otherwise usable — these are often transient.
      map.on('error', (e: { error?: { message?: string } }) => {
        if (typeof console !== 'undefined') console.warn('[panoptes] map error:', e?.error?.message ?? e)
      })

      // Keep the GL canvas matched to its container. MapLibre reads the size on
      // construction; if the container settles a frame later (route transition,
      // late layout) the canvas can stay 0-sized and render blank until a resize.
      if (containerRef.current) {
        resizeObserver = new ResizeObserver(() => map.resize())
        resizeObserver.observe(containerRef.current)
      }

      map.on('load', async () => {
        if (disposed) return

        const hexGeoJSON = await buildHexGeoJSON(h3)
        // Collect unique zone IDs from study assignments for the match expression
        const uniqueZoneIds = [...new Set(
          (study.zones?.assignments ?? []).map((a) => a.zone)
        )].sort((a, b) => a - b)

        map.addSource('hexes', { type: 'geojson', data: hexGeoJSON })

        // Fill layer — starts with numeric metric
        const initialRange = computeMetricRange(study, activeMetric)
        map.addLayer({
          id: 'hex-fill',
          type: 'fill',
          source: 'hexes',
          paint: {
            'fill-color':
              activeMetric === 'zones'
                ? buildZoneColorExpression(uniqueZoneIds)
                : buildColorExpression(activeMetric, initialRange.min, initialRange.max),
            'fill-opacity': activeMetric === 'zones' ? 0.65 : 0.45,
          },
        })

        map.addLayer({
          id: 'hex-line',
          type: 'line',
          source: 'hexes',
          paint: {
            'line-color': 'rgba(154, 166, 174, 0.13)',
            'line-width': 0.8,
          },
        })

        map.addLayer({
          id: 'hex-whitespace',
          type: 'line',
          source: 'hexes',
          filter: ['==', ['get', 'white_space'], true],
          paint: { 'line-color': '#67e8f9', 'line-width': 2 },
          layout: { visibility: showWhiteSpace ? 'visible' : 'none' },
        })

        map.addLayer({
          id: 'carto-labels-layer',
          type: 'raster',
          source: 'carto-labels',
          minzoom: 0,
          maxzoom: 22,
        })

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        map.fitBounds(
          [[minLon, minLat], [maxLon, maxLat]],
          { padding: { top: 60, bottom: 60, left: 360, right: 60 }, animate: !reduced, duration: reduced ? 0 : 800 }
        )

        // Belt-and-braces: ensure the canvas matches the container now that the
        // style + first layers are in (covers the 0-size-at-init edge case).
        map.resize()

        // ── Candidate markers ──────────────────────────────────────────────
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        const sortedCandidates = [...study.candidates].sort(
          (a, b) => b.score.total - a.score.total
        )
        sortedCandidates.forEach((candidate, idx) => {
          const el = document.createElement('div')
          el.className = 'pv-marker'
          el.textContent = String(idx + 1)
          el.setAttribute('aria-label', `Candidate ${idx + 1}: ${candidate.name}`)
          el.title = candidate.name

          const marker = new maplibre.Marker({ element: el })
            .setLngLat([candidate.lon, candidate.lat])
            .addTo(map)
          markersRef.current.push(marker)
        })

        // ── Recommendation markers ─────────────────────────────────────────
        recMarkersRef.current.forEach((m) => m.remove())
        recMarkersRef.current = []

        const recs = study.recommendations ?? []
        recs.forEach((rec) => {
          const el = document.createElement('div')
          el.className = `pv-rec-marker${rec.white_space ? ' pv-rec-marker--ws' : ''}`
          el.textContent = String(rec.rank)
          el.setAttribute('aria-label', `Recommended area ${rec.rank}: ${rec.area_name}`)
          el.title = rec.area_name

          el.addEventListener('click', (e) => {
            const mouseEv = e as MouseEvent
            setRecPopup({ visible: true, x: mouseEv.clientX, y: mouseEv.clientY, rec })

            const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            if (isReduced) {
              map.jumpTo({ center: [rec.lon, rec.lat], zoom: 15 })
            } else {
              map.flyTo({ center: [rec.lon, rec.lat], zoom: 15, duration: 1200, essential: true })
            }
          })

          const marker = new maplibre.Marker({ element: el })
            .setLngLat([rec.lon, rec.lat])
            .addTo(map)
          recMarkersRef.current.push(marker)
        })

        // ── Hex hover ──────────────────────────────────────────────────────
        map.on('mousemove', 'hex-fill', (e) => {
          const feature = e.features?.[0]
          if (!feature?.properties) return
          const props = feature.properties as Record<string, unknown>
          const adjustments = props['adjustments_json']
            ? (JSON.parse(props['adjustments_json'] as string) as Array<{ name: string; points: number }>)
            : []

          onTooltipChange({
            visible: true,
            x: e.point.x,
            y: e.point.y,
            data: {
              h3Id: (props['h3_id'] as string) ?? '',
              demand: (props['demand'] as number) ?? 0,
              competition: (props['competition'] as number) ?? 0,
              access: (props['access'] as number) ?? 0,
              total: (props['total'] as number) ?? 0,
              population: (props['population'] as number) ?? 0,
              targetCount: (props['target_count'] as number) ?? 0,
              opportunity: (props['opportunity'] as number) ?? null,
              adjustments,
            },
          })
          map.getCanvas().style.cursor = 'crosshair'
        })

        map.on('mouseleave', 'hex-fill', () => {
          onTooltipChange({ visible: false, x: 0, y: 0, data: null })
          map.getCanvas().style.cursor = ''
        })

        // Close rec popup when clicking the map background
        map.on('click', () => {
          setRecPopup({ visible: false, x: 0, y: 0, rec: null })
        })
      })
      } catch (err) {
        // Most often a WebGL/context failure that slipped past detectWebGL().
        isInitializedRef.current = false
        if (!disposed) {
          setMapError(
            'The map failed to load in this browser. Try enabling hardware acceleration, disabling extensions that block WebGL, or opening the page in Chrome or Safari.',
          )
        }
        if (typeof console !== 'undefined') console.error('[panoptes] map init failed:', err)
      }
    })()

    return () => {
      disposed = true
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [study, buildHexGeoJSON])

  // ── Update hex fill when metric changes ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!map.getLayer('hex-fill')) return

    if (activeMetric === 'zones') {
      const uniqueZoneIds = [...new Set(
        (study.zones?.assignments ?? []).map((a) => a.zone)
      )].sort((a, b) => a - b)
      map.setPaintProperty('hex-fill', 'fill-color', buildZoneColorExpression(uniqueZoneIds))
      map.setPaintProperty('hex-fill', 'fill-opacity', 0.65)
    } else {
      const range = computeMetricRange(study, activeMetric)
      map.setPaintProperty('hex-fill', 'fill-color', buildColorExpression(activeMetric, range.min, range.max))
      map.setPaintProperty('hex-fill', 'fill-opacity', 0.45)
    }
  }, [activeMetric, study])

  // ── White-space layer visibility ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!map.getLayer('hex-whitespace')) return
    map.setLayoutProperty('hex-whitespace', 'visibility', showWhiteSpace ? 'visible' : 'none')
  }, [showWhiteSpace])

  // Force white-space on when opportunity metric is active
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!map.getLayer('hex-whitespace')) return
    if (activeMetric === 'opportunity') {
      map.setLayoutProperty('hex-whitespace', 'visibility', 'visible')
    }
  }, [activeMetric])

  // ── Fly to candidate ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToTrigger) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      map.jumpTo({ center: [flyToTrigger.lon, flyToTrigger.lat], zoom: 15 })
    } else {
      map.flyTo({ center: [flyToTrigger.lon, flyToTrigger.lat], zoom: 15, duration: 1200, essential: true })
    }
  }, [flyToTrigger])

  // ── Fly to recommendation ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToRec) return
    setRecPopup({ visible: true, x: window.innerWidth / 2, y: window.innerHeight / 2, rec: flyToRec })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      map.jumpTo({ center: [flyToRec.lon, flyToRec.lat], zoom: 15 })
    } else {
      map.flyTo({ center: [flyToRec.lon, flyToRec.lat], zoom: 15, duration: 1200, essential: true })
    }
  }, [flyToRec])

  // ── Legend state ─────────────────────────────────────────────────────────
  const legendRange = computeMetricRange(study, activeMetric)
  const metricLabel =
    METRIC_OPTIONS.find((o) => o.key === activeMetric)?.label.toUpperCase() ??
    activeMetric.toUpperCase()

  // Build zone legend entries (only when Zones is active)
  const zoneLegendEntries: ZoneLegendEntry[] = []
  if (activeMetric === 'zones' && study.zones) {
    const seenZones = new Set<number>()
    for (const a of study.zones.assignments) {
      seenZones.add(a.zone)
    }
    const sortedIds = [...seenZones].sort((a, b) => a - b)
    for (const id of sortedIds) {
      const label = study.zones.labels[String(id)]
      if (label !== undefined) {
        zoneLegendEntries.push({ zoneId: id, label, color: zoneColor(id) })
      }
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} className="pv-map" aria-label="Panoptes map" />

      {mapError ? (
        <div className="pv-map-error" role="alert">
          <p className="pv-map-error__title">Map couldn’t load</p>
          <p className="pv-map-error__body">{mapError}</p>
        </div>
      ) : null}

      {activeMetric === 'zones' ? (
        <ZoneLegend entries={zoneLegendEntries} />
      ) : (
        <MapLegend
          metricLabel={metricLabel}
          min={legendRange.min}
          max={legendRange.max}
          showWhiteSpaceHint={activeMetric === 'opportunity' || showWhiteSpace}
        />
      )}

      <RecPopup state={recPopup} />
    </div>
  )
}
