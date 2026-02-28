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

const HotspotMap = dynamic(() => import('@/app/hotspots/_components/hotspot-map'), { ssr: false })

export default function HotspotMapLoader({
  hotspots,
  days,
  riskZones,
  userRole,
}: {
  hotspots: Hotspot[]
  days: number
  riskZones: RiskZone[]
  userRole: string
}) {
  return <HotspotMap hotspots={hotspots} days={days} riskZones={riskZones} userRole={userRole} />
}
