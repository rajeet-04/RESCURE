'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
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

interface HotspotMapProps {
  hotspots: Hotspot[]
  days: number
  riskZones: RiskZone[]
  userRole: string
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

function MapLegend({ showHistorical, showPredictive }: { showHistorical: boolean; showPredictive: boolean }) {
  const map = useMap()

  useEffect(() => {
    const legend = new L.Control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '')
      div.style.cssText =
        'background:white;padding:10px 12px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,.2);font-size:12px;line-height:1.8'
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
      div.innerHTML = items.join('<br>')
      return div
    }
    legend.addTo(map)
    return () => { legend.remove() }
  }, [map, showHistorical, showPredictive])

  return null
}

export default function HotspotMapInner({ hotspots, days, riskZones }: HotspotMapProps) {
  const [showHistorical, setShowHistorical] = useState(true)
  const [showPredictive, setShowPredictive] = useState(true)

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })
  }, [])

  const center: [number, number] = hotspots.length > 0
    ? [hotspots[0].lat, hotspots[0].lng]
    : riskZones.length > 0
    ? [riskZones[0].lat, riskZones[0].lng]
    : [20.5937, 78.9629]

  const maxCount = Math.max(...hotspots.map((h) => h.count), 1)

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
      </div>

      <div className="flex-1">
        <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHistorical && hotspots.map((hotspot) => (
            <CircleMarker
              key={`h-${hotspot.geohash}`}
              center={[hotspot.lat, hotspot.lng]}
              radius={urgencyRadius(hotspot.count, maxCount)}
              pathOptions={{
                color: urgencyColor(hotspot.avgUrgency),
                fillColor: urgencyColor(hotspot.avgUrgency),
                fillOpacity: 0.5 + (hotspot.count / maxCount) * 0.4,
                weight: 1,
              }}
            >
              <Popup>
                <div className="min-w-[140px]">
                  <p className="font-semibold text-sm">{hotspot.count} incidents</p>
                  <p className="text-xs text-gray-500">in last {days} days</p>
                  <p className="text-xs text-gray-500">Avg urgency: {hotspot.avgUrgency.toFixed(1)}/4</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {showPredictive && riskZones.map((zone) => (
            <CircleMarker
              key={`p-${zone.geohash}`}
              center={[zone.lat, zone.lng]}
              radius={8 + zone.riskScore * 18}
              pathOptions={{
                color: riskColor(zone.riskScore),
                fillColor: riskColor(zone.riskScore),
                fillOpacity: 0.4 + zone.riskScore * 0.45,
                weight: zone.hasActiveSurge ? 2 : 1,
                dashArray: zone.hasActiveSurge ? '4 2' : undefined,
              }}
            >
              <Popup>
                <div className="min-w-[140px]">
                  <p className="font-semibold text-sm">Risk Zone</p>
                  <p className="text-xs text-gray-500">Score: {(zone.riskScore * 100).toFixed(0)}%</p>
                  {zone.hasActiveSurge && (
                    <p className="text-xs font-medium text-purple-600">Active surge event</p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          <MapLegend showHistorical={showHistorical} showPredictive={showPredictive} />
        </MapContainer>
      </div>
    </div>
  )
}
