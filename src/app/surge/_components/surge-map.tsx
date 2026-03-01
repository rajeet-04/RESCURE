'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface SurgeMapProps {
  lat: number
  lng: number
  radius: number // in km
}

export default function SurgeMapInner({ lat, lng, radius }: SurgeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

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

    const center: L.LatLngExpression = [lat, lng]
    const map = L.map(containerRef.current, { center, zoom: 11 })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const pulsingIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 20px; height: 20px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(239,68,68,0.4);
        animation: pulse 1.5s infinite;
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    const radiusMeters = radius * 1000

    L.circle(center, {
      radius: radiusMeters,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map)

    L.marker(center, { icon: pulsingIcon })
      .bindPopup('Surge zone center')
      .addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, radius])

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
  )
}
