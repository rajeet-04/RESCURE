'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'next/navigation'

type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface WorkerCase {
  id: string
  state: string
  report: {
    lat: number
    lng: number
    urgencyScore: UrgencyLevel
    address: string | null
    description: string | null
  } | null
}

interface WorkerMapProps {
  cases: WorkerCase[]
  userLocation: [number, number] | null
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
    html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [map, center])
  return null
}

export default function WorkerMap({ cases, userLocation }: WorkerMapProps) {
  const router = useRouter()

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
      ._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })
  }, [])

  const defaultCenter: [number, number] = userLocation ?? [20.5937, 78.9629]
  const casesWithLocation = cases.filter((c) => c.report?.lat && c.report?.lng)

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && <RecenterMap center={userLocation} />}
      {userLocation && (
        <Marker position={userLocation} icon={createUserIcon()}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {casesWithLocation.map((c) => (
        <Marker
          key={c.id}
          position={[c.report!.lat, c.report!.lng]}
          icon={createColoredIcon(
            urgencyColorMap[c.report!.urgencyScore] ?? '#f97316'
          )}
          eventHandlers={{
            click: () => router.push(`/worker/cases/${c.id}`),
          }}
        >
          <Popup>
            <div className="space-y-1 min-w-[150px]">
              <p
                className="text-xs font-semibold"
                style={{
                  color: urgencyColorMap[c.report!.urgencyScore] ?? '#f97316',
                }}
              >
                {c.report!.urgencyScore}
              </p>
              {c.report!.address && (
                <p className="text-xs text-gray-600">{c.report!.address}</p>
              )}
              <button
                className="text-xs text-orange-600 hover:underline mt-1"
                onClick={() => router.push(`/worker/cases/${c.id}`)}
              >
                View case →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
