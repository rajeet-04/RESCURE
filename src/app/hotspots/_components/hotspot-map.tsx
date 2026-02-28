'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Hotspot {
  geohash: string
  lat: number
  lng: number
  count: number
  avgUrgency: number
}

interface HotspotMapProps {
  hotspots: Hotspot[]
  days: number
}

function urgencyColor(avgUrgency: number): string {
  if (avgUrgency >= 3.5) return '#ef4444' // red — high urgency
  if (avgUrgency >= 2.5) return '#f97316' // orange
  if (avgUrgency >= 1.5) return '#eab308' // yellow
  return '#22c55e' // green — low urgency
}

function urgencyRadius(count: number, maxCount: number): number {
  const minR = 8
  const maxR = 30
  if (maxCount === 0) return minR
  return minR + ((count / maxCount) * (maxR - minR))
}

export default function HotspotMapInner({ hotspots, days }: HotspotMapProps) {
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
    : [20.5937, 78.9629]

  const maxCount = Math.max(...hotspots.map((h) => h.count), 1)

  return (
    <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotspots.map((hotspot) => (
        <CircleMarker
          key={hotspot.geohash}
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
              <p className="text-xs text-gray-500">
                Avg urgency: {hotspot.avgUrgency.toFixed(1)}/4
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
