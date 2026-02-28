'use client'

import dynamic from 'next/dynamic'

interface Hotspot {
  geohash: string
  lat: number
  lng: number
  count: number
  avgUrgency: number
}

const HotspotMap = dynamic(() => import('@/app/hotspots/_components/hotspot-map'), { ssr: false })

export default function HotspotMapLoader({ hotspots, days }: { hotspots: Hotspot[]; days: number }) {
  return <HotspotMap hotspots={hotspots} days={days} />
}
