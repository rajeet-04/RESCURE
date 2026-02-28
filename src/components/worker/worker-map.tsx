'use client'

import { useEffect, useRef } from 'react'
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

export default function WorkerMap({ cases, userLocation }: WorkerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const router = useRouter()

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const defaultCenter: [number, number] = userLocation ?? [20.5937, 78.9629]
    const map = L.map(containerRef.current, { center: defaultCenter, zoom: 12 })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    if (userLocation) {
      map.setView(userLocation, 13)
      L.marker(userLocation, { icon: createUserIcon() })
        .bindPopup('You are here')
        .addTo(map)
    }

    const casesWithLocation = cases.filter((c) => c.report?.lat && c.report?.lng)

    for (const c of casesWithLocation) {
      const color = urgencyColorMap[c.report!.urgencyScore] ?? '#f97316'
      const marker = L.marker([c.report!.lat, c.report!.lng], {
        icon: createColoredIcon(color)
      }).addTo(map)

      const popupContent = document.createElement('div')
      popupContent.className = 'space-y-1 min-w-[150px]'
      popupContent.innerHTML = `
        <p class="text-xs font-semibold" style="color: ${color}">
          ${c.report!.urgencyScore}
        </p>
        ${c.report!.address ? `<p class="text-xs text-gray-600">${c.report!.address}</p>` : ''}
        <button class="text-xs text-orange-600 hover:underline mt-1 view-case-btn" data-id="${c.id}">
          View case →
        </button>
      `
      marker.bindPopup(popupContent)
    }

    map.on('popupopen', (e) => {
      const btn = e.popup.getElement()?.querySelector('.view-case-btn') as HTMLButtonElement
      if (btn) {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id')
          if (id) router.push(`/worker/cases/${id}`)
        }
      }
    })

    // Remove the event listener on cleanup
    return () => {
      map.off('popupopen')
    }
  }, [cases, userLocation, router])

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
  )
}
