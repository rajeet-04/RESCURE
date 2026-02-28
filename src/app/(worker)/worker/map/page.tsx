'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const WorkerMap = dynamic(
  () => import('@/components/worker/worker-map'),
  { ssr: false }
)

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

export default function WorkerMapPage() {
  const [cases, setCases] = useState<WorkerCase[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    fetch('/api/worker/cases')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: WorkerCase[]) => setCases(data))
      .finally(() => setLoading(false))

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
      })
    }
  }, [])

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">My Map</h1>
        <span className="text-sm text-gray-500">{cases.length} cases</span>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center bg-gray-50">
            <p className="text-sm text-gray-400">Loading map…</p>
          </div>
        ) : (
          <WorkerMap cases={cases} userLocation={userLocation} />
        )}
      </div>
    </div>
  )
}
