'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const RescueMap = dynamic(() => import('@/components/map/rescue-map'), { ssr: false })

interface Incident {
  id: string
  title: string
  latitude: number
  longitude: number
  urgencyScore: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
}

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/incidents?status=PENDING,ASSIGNED,IN_PROGRESS&limit=200')
        if (res.ok) {
          const data = await res.json()
          setIncidents(data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Incident Map</h1>
        <span className="text-sm text-gray-500">{incidents.length} active incidents</span>
      </div>

      <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ height: '70vh' }}>
        {loading ? (
          <div className="flex h-full items-center justify-center bg-gray-50">
            <p className="text-sm text-gray-400">Loading map…</p>
          </div>
        ) : (
          <RescueMap incidents={incidents} />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="font-medium">Urgency:</span>
        {[
          { label: 'Critical', color: '#ef4444' },
          { label: 'High', color: '#f97316' },
          { label: 'Medium', color: '#eab308' },
          { label: 'Low', color: '#22c55e' },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
