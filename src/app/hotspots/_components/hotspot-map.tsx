'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Hotspot {
  geohash: string
  lat: number
  lng: number
  count: number
  avgUrgency: number
}

interface RiskZone {
  geohash: string
  lat: number
  lng: number
  riskScore: number
  hasActiveSurge: boolean
}

interface NGOLocation {
  id: string
  name: string
  lat: number
  lng: number
  city: string | null
  activeCaseCount: number
}

interface HotspotMapProps {
  hotspots: Hotspot[]
  days: number
  riskZones: RiskZone[]
  userRole: string
  ngos: NGOLocation[]
}

function urgencyColor(avgUrgency: number): string {
  if (avgUrgency >= 3.5) return '#ef4444'
  if (avgUrgency >= 2.5) return '#f97316'
  if (avgUrgency >= 1.5) return '#eab308'
  return '#22c55e'
}

function urgencyRadius(count: number, maxCount: number): number {
  const minR = 8
  const maxR = 30
  if (maxCount === 0) return minR
  return minR + ((count / maxCount) * (maxR - minR))
}

function riskColor(score: number): string {
  return score >= 0.6 ? '#9333ea' : '#c084fc'
}

function buildLegendHtml(showHistorical: boolean, showPredictive: boolean, showNGOs: boolean): string {
  const items: string[] = ['<strong style="display:block;margin-bottom:4px">Legend</strong>']
  if (showHistorical) {
    items.push(
      '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;margin-right:6px"></span>Critical incidents',
      '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f97316;margin-right:6px"></span>High incidents',
      '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#eab308;margin-right:6px"></span>Medium incidents',
      '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;margin-right:6px"></span>Low incidents',
    )
  }
  if (showPredictive) {
    items.push(
      '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#9333ea;margin-right:6px"></span>High risk (&ge;0.6)',
      '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#c084fc;margin-right:6px"></span>Moderate risk',
    )
  }
  if (showNGOs) {
    items.push(
      '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#16a34a;margin-right:6px"></span>NGO location',
    )
  }
  return items.join('<br>')
}

export default function HotspotMapInner({ hotspots, days, riskZones, ngos = [] }: HotspotMapProps) {
  const [showHistorical, setShowHistorical] = useState(true)
  const [showPredictive, setShowPredictive] = useState(true)
  const [showNGOs, setShowNGOs] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup>(L.layerGroup())
  const legendRef = useRef<L.Control | null>(null)

  const center: L.LatLngExpression = hotspots.length > 0
    ? [hotspots[0].lat, hotspots[0].lng]
    : riskZones.length > 0
      ? [riskZones[0].lat, riskZones[0].lng]
      : [20.5937, 78.9629]

  const maxCount = Math.max(...hotspots.map((h) => h.count), 1)

  // Initialise map imperatively – full control over create / destroy
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { center, zoom: 5 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    layersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Draw / redraw data layers whenever data or visibility toggles change
  const drawLayers = useCallback(() => {
    const group = layersRef.current
    group.clearLayers()

    if (showHistorical) {
      for (const h of hotspots) {
        const color = urgencyColor(h.avgUrgency)
        L.circleMarker([h.lat, h.lng], {
          radius: urgencyRadius(h.count, maxCount),
          color,
          fillColor: color,
          fillOpacity: 0.5 + (h.count / maxCount) * 0.4,
          weight: 1,
        })
          .bindPopup(
            `<div style="min-width:140px">
              <p style="font-weight:600;font-size:14px">${h.count} incidents</p>
              <p style="font-size:12px;color:#6b7280">in last ${days} days</p>
              <p style="font-size:12px;color:#6b7280">Avg urgency: ${h.avgUrgency.toFixed(1)}/4</p>
            </div>`,
          )
          .addTo(group)
      }
    }

    if (showPredictive) {
      for (const z of riskZones) {
        const color = riskColor(z.riskScore)
        L.circleMarker([z.lat, z.lng], {
          radius: 8 + z.riskScore * 18,
          color,
          fillColor: color,
          fillOpacity: 0.4 + z.riskScore * 0.45,
          weight: z.hasActiveSurge ? 2 : 1,
          dashArray: z.hasActiveSurge ? '4 2' : undefined,
        })
          .bindPopup(
            `<div style="min-width:140px">
              <p style="font-weight:600;font-size:14px">Risk Zone</p>
              <p style="font-size:12px;color:#6b7280">Score: ${(z.riskScore * 100).toFixed(0)}%</p>
              ${z.hasActiveSurge ? '<p style="font-size:12px;font-weight:500;color:#9333ea">Active surge event</p>' : ''}
            </div>`,
          )
          .addTo(group)
      }
    }

    if (showNGOs) {
      for (const ngo of ngos) {
        L.circleMarker([ngo.lat, ngo.lng], {
          radius: 7,
          color: '#16a34a',
          fillColor: '#16a34a',
          fillOpacity: 0.75,
          weight: 2,
        })
          .bindPopup(
            `<div style="min-width:140px">
              <p style="font-weight:600;font-size:14px">${ngo.name}</p>
              <p style="font-size:12px;color:#6b7280">${ngo.city ?? 'NGO'}</p>
              <p style="font-size:12px;color:#6b7280">Active cases: ${ngo.activeCaseCount}</p>
            </div>`,
          )
          .addTo(group)
      }
    }
  }, [hotspots, riskZones, ngos, showHistorical, showPredictive, showNGOs, days, maxCount])

  useEffect(() => {
    if (mapRef.current) drawLayers()
  }, [drawLayers])

  // Legend control
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (legendRef.current) legendRef.current.remove()

    const legend = new L.Control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '')
      div.style.cssText =
        'background:white;padding:10px 12px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,.2);font-size:12px;line-height:1.8'
      div.innerHTML = buildLegendHtml(showHistorical, showPredictive, showNGOs)
      return div
    }
    legend.addTo(map)
    legendRef.current = legend

    return () => { legend.remove() }
  }, [showHistorical, showPredictive, showNGOs])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-3 py-2 bg-white border-b text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showHistorical}
            onChange={(e) => setShowHistorical(e.target.checked)}
            className="accent-orange-500"
          />
          Historical incidents
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showPredictive}
            onChange={(e) => setShowPredictive(e.target.checked)}
            className="accent-purple-600"
          />
          Predictive risk zones
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showNGOs}
            onChange={(e) => setShowNGOs(e.target.checked)}
            className="accent-green-600"
          />
          NGO locations
        </label>
      </div>

      <div className="flex-1">
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  )
}
