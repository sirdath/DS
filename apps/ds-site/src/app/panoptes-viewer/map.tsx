'use client'

import { useEffect, useRef, useCallback } from 'react'
import type {
  PanoptesStudy,
  PanoptesCandidate,
  MetricKey,
} from './types'

// MapLibre + h3-js are loaded only client-side
// Types imported for IDE support; actual modules loaded dynamically
import type maplibregl from 'maplibre-gl'

// ── Color ramp stops (ordered low → high) ─────────────────────────────────
const COLOR_STOPS = [
  '#1f2937',
  '#1e3a8a',
  '#1d4ed8',
  '#2563eb',
  '#22d3ee',
] as const

/**
 * Build a MapLibre interpolate expression for a given metric, normalised to
 * the actual value range present in the loaded study.
 *
 * @param metric  - the property name on each GeoJSON feature
 * @param min     - minimum observed value for this metric across all hexes
 * @param max     - maximum observed value for this metric across all hexes
 */
function buildColorExpression(
  metric: MetricKey,
  min: number,
  max: number,
): maplibregl.ExpressionSpecification {
  const prop = metric as string

  // Degenerate case: every hex has the same value — paint the midpoint colour.
  if (min === max) {
    return COLOR_STOPS[2] as unknown as maplibregl.ExpressionSpecification
  }

  // Spread the five colour stops evenly across [min, max].
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

/** Keys of HexScore that are plain numeric metrics (excludes id, coords, array). */
type NumericHexMetric = 'demand' | 'competition' | 'access' | 'total'

/**
 * Compute the min and max of a given metric across the study's hexes.
 * For "opportunity" the values live in study.opportunities; everything else
 * is on study.hexes directly.
 */
function computeMetricRange(
  study: PanoptesStudy,
  metric: MetricKey,
): { min: number; max: number } {
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

/** Compute GeoJSON polygon boundary for a hex cell using h3-js */
function hexToGeoJsonPolygon(
  h3: typeof import('h3-js'),
  h3Id: string,
  properties: Record<string, unknown>
): GeoJsonFeaturePolygon {
  // cellToBoundary returns [lat, lng] pairs
  const boundary = h3.cellToBoundary(h3Id)
  const coordinates = boundary.map(([lat, lng]) => [lng, lat] as [number, number])
  // Close ring
  const first = coordinates[0]
  if (first) coordinates.push(first)

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
    properties,
  }
}

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

interface MapViewProps {
  study: PanoptesStudy
  activeMetric: MetricKey
  showWhiteSpace: boolean
  onTooltipChange: (state: TooltipState) => void
  flyToTrigger: PanoptesCandidate | null
}

export function MapView({
  study,
  activeMetric,
  showWhiteSpace,
  onTooltipChange,
  flyToTrigger,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const isInitializedRef = useRef(false)

  // Build the GeoJSON feature collections from the study
  const buildHexGeoJSON = useCallback(
    async (h3Module: typeof import('h3-js')) => {
      // Build a lookup map for opportunity data
      const oppMap = new Map<string, { opportunity: number; white_space: boolean }>()
      for (const opp of study.opportunities) {
        oppMap.set(opp.h3_id, opp)
      }

      const features: GeoJsonFeaturePolygon[] = []
      for (const hex of study.hexes) {
        const opp = oppMap.get(hex.h3_id)
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
          })
        )
      }

      const collection: GeoJsonFeatureCollection = {
        type: 'FeatureCollection',
        features,
      }
      return collection
    },
    [study]
  )

  // Initialize the map
  useEffect(() => {
    if (isInitializedRef.current || !containerRef.current) return
    isInitializedRef.current = true

    let disposed = false

    void (async () => {
      // Dynamic imports — safe for SSR guard
      const [maplibre, h3] = await Promise.all([
        import('maplibre-gl'),
        import('h3-js'),
      ])

      if (disposed || !containerRef.current) return

      // Compute bounds from hex lat/lon
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

      const map = new maplibre.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
              attribution:
                '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
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

      map.on('load', async () => {
        if (disposed) return

        const hexGeoJSON = await buildHexGeoJSON(h3)

        // Add hex source
        map.addSource('hexes', {
          type: 'geojson',
          data: hexGeoJSON,
        })

        // Fill layer
        const initialRange = computeMetricRange(study, activeMetric)
        map.addLayer({
          id: 'hex-fill',
          type: 'fill',
          source: 'hexes',
          paint: {
            'fill-color': buildColorExpression(
              activeMetric,
              initialRange.min,
              initialRange.max,
            ),
            'fill-opacity': 0.38,
          },
        })

        // Border layer
        map.addLayer({
          id: 'hex-line',
          type: 'line',
          source: 'hexes',
          paint: {
            'line-color': 'rgba(154, 166, 174, 0.13)',
            'line-width': 0.8,
          },
        })

        // White-space outline layer (always present, visibility toggled)
        map.addLayer({
          id: 'hex-whitespace',
          type: 'line',
          source: 'hexes',
          filter: ['==', ['get', 'white_space'], true],
          paint: {
            'line-color': '#67e8f9',
            'line-width': 2,
          },
          layout: {
            visibility: showWhiteSpace ? 'visible' : 'none',
          },
        })

        // Fit to hex bounds
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        map.fitBounds(
          [[minLon, minLat], [maxLon, maxLat]],
          {
            padding: { top: 60, bottom: 60, left: 360, right: 60 },
            animate: !reduced,
            duration: reduced ? 0 : 800,
          }
        )

        // ── Candidate markers ────────────────────────────────────────────
        // Clear existing markers
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

        // ── Hex hover events ─────────────────────────────────────────────
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
      })
    })()

    return () => {
      disposed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [study, buildHexGeoJSON]) // Re-init when study changes; metric/ws updated via separate effects

  // Update hex fill color when metric changes (after initial mount)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!map.getLayer('hex-fill')) return

    const range = computeMetricRange(study, activeMetric)
    map.setPaintProperty(
      'hex-fill',
      'fill-color',
      buildColorExpression(activeMetric, range.min, range.max),
    )
  }, [activeMetric, study])

  // Update white-space layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!map.getLayer('hex-whitespace')) return

    map.setLayoutProperty(
      'hex-whitespace',
      'visibility',
      showWhiteSpace ? 'visible' : 'none'
    )
  }, [showWhiteSpace])

  // Force white-space when metric is "opportunity"
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!map.getLayer('hex-whitespace')) return

    if (activeMetric === 'opportunity') {
      map.setLayoutProperty('hex-whitespace', 'visibility', 'visible')
    }
  }, [activeMetric])

  // Fly to candidate
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToTrigger) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      map.jumpTo({ center: [flyToTrigger.lon, flyToTrigger.lat], zoom: 15 })
    } else {
      map.flyTo({
        center: [flyToTrigger.lon, flyToTrigger.lat],
        zoom: 15,
        duration: 1200,
        essential: true,
      })
    }
  }, [flyToTrigger])

  return <div ref={containerRef} className="pv-map" aria-label="Panoptes map" />
}
