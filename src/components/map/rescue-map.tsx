'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'next/navigation'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fix default leaflet icon paths broken by webpack
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: [number, number] = [20.5937, 78.9629]
    const zoom = incidents.length > 0 ? 10 : 5

    const map = L.map(containerRef.current, { center, zoom })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const layerGroup = L.featureGroup().addTo(map)

    for (const incident of incidents) {
      const marker = L.marker([incident.latitude, incident.longitude], {
        icon: createColoredIcon(urgencyColorMap[incident.urgencyScore] ?? '#f97316')
      }).addTo(layerGroup)

      const popupContent = document.createElement('div')
      popupContent.className = 'space-y-1 min-w-[160px]'
      popupContent.innerHTML = `
        <p class="font-semibold text-sm leading-snug">${incident.title}</p>
        <p class="text-xs font-medium" style="color: ${urgencyColorMap[incident.urgencyScore]}">
          ${incident.urgencyScore}
        </p>
        <button class="block text-xs text-orange-600 hover:underline mt-1 view-case-btn" data-id="${incident.id}">
          View case →
        </button>
      `

      marker.bindPopup(popupContent)
    }

    if (incidents.length > 0) {
      map.fitBounds(layerGroup.getBounds(), { padding: [40, 40] })
    }

    // Handle clicks inside popups
    map.on('popupopen', (e) => {
      const btn = e.popup.getElement()?.querySelector('.view-case-btn') as HTMLButtonElement
      if (btn) {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id')
          if (id) router.push(`/dashboard/cases/${id}`)
        }
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [incidents, router])

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
  )
}
