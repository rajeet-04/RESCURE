'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

interface Incident {
  id: string
  title: string
  latitude: number
  longitude: number
  urgencyScore: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
}

interface RescueMapProps {
  incidents: Incident[]
}

const urgencyColorMap: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
}

function createColoredIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

export default function RescueMap({ incidents }: RescueMapProps) {
  const [mapId, setMapId] = useState<string>('')
  
  useEffect(() => {
    // Fix default leaflet icon paths broken by webpack
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })
    
    // Generate a new ID to force MapContainer to remount on HMR
    setMapId(Date.now().toString())
  }, [])

  const center: [number, number] = [20.5937, 78.9629]
  const zoom = incidents.length > 0 ? 10 : 5

  const bounds =
    incidents.length > 0
      ? incidents.map((i): [number, number] => [i.latitude, i.longitude])
      : undefined

  if (!mapId) return null

  return (
    <MapContainer
      key={mapId}
      center={center}
      zoom={zoom}
      bounds={bounds}
      boundsOptions={{ padding: [40, 40] }}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.latitude, incident.longitude]}
          icon={createColoredIcon(urgencyColorMap[incident.urgencyScore] ?? '#f97316')}
        >
          <Popup>
            <div className="space-y-1 min-w-[160px]">
              <p className="font-semibold text-sm leading-snug">{incident.title}</p>
              <p
                className="text-xs font-medium"
                style={{ color: urgencyColorMap[incident.urgencyScore] }}
              >
                {incident.urgencyScore}
              </p>
              <Link
                href={`/dashboard/cases/${incident.id}`}
                className="block text-xs text-orange-600 hover:underline mt-1"
              >
                View case →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
