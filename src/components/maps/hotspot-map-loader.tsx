'use client'

import dynamic from 'next/dynamic'

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

const HotspotMap = dynamic(() => import('@/app/hotspots/_components/hotspot-map'), { ssr: false })

export default function HotspotMapLoader({
  hotspots,
  days,
  riskZones,
  userRole,
  ngos,
}: {
  hotspots: Hotspot[]
  days: number
  riskZones: RiskZone[]
  userRole: string
  ngos: NGOLocation[]
}) {
  return <HotspotMap hotspots={hotspots} days={days} riskZones={riskZones} userRole={userRole} ngos={ngos} />
}
