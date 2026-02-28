'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface SurgeMapProps {
  lat: number
  lng: number
  radius: number // in km
}

export default function SurgeMapInner({ lat, lng, radius }: SurgeMapProps) {
  const [mapId, setMapId] = useState<string>('')
  useEffect(() => {
    setMapId(Date.now().toString())
  }, [])
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })
  }, [])

  const center: [number, number] = [lat, lng]
  const radiusMeters = radius * 1000

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

  return (
    <>
    {mapId && (
    <MapContainer key={mapId} center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={center}
        radius={radiusMeters}
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2 }}
      />
      <Marker position={center} icon={pulsingIcon}>
        <Popup>Surge zone center</Popup>
      </Marker>
    </MapContainer>
    )}
    </>
  )
}
