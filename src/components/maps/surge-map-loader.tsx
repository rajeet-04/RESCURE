'use client'

import dynamic from 'next/dynamic'

const SurgeMap = dynamic(() => import('@/app/surge/_components/surge-map'), { ssr: false })

export default function SurgeMapLoader({ lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  return <SurgeMap lat={lat} lng={lng} radius={radius} />
}
