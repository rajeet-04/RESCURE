'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { MapPin, Clock } from 'lucide-react'

type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface Incident {
  id: string
  title: string
  urgencyScore: UrgencyLevel
  city: string
  landmark?: string | null
  latitude: number
  longitude: number
  status: string
  createdAt: string
}

const urgencyColors: Record<UrgencyLevel, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
}

const urgencyOrder: UrgencyLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function NGOCasesPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [activeFilter, setActiveFilter] = useState<UrgencyLevel | 'ALL'>('ALL')
  const [accepting, setAccepting] = useState<string | null>(null)

  useEffect(() => {
    async function loadInitial() {
      const res = await fetch('/api/incidents?status=PENDING&limit=50')
      if (res.ok) {
        const data = await res.json()
        setIncidents(data)
      }
    }
    loadInitial()

    const supabase = createClient()
    const channel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'IncidentReport' },
        (payload) => {
          const newIncident = payload.new as Incident
          if (newIncident.status === 'PENDING') {
            setIncidents((prev) => [newIncident, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'IncidentReport' },
        (payload) => {
          const updated = payload.new as Incident
          setIncidents((prev) =>
            prev.map((inc) => (inc.id === updated.id ? { ...inc, ...updated } : inc))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function acceptCase(incidentId: string) {
    setAccepting(incidentId)
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ASSIGNED' }),
      })
      if (res.ok) {
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === incidentId ? { ...inc, status: 'ASSIGNED' } : inc
          )
        )
      }
    } finally {
      setAccepting(null)
    }
  }

  const filtered =
    activeFilter === 'ALL'
      ? incidents
      : incidents.filter((i) => i.urgencyScore === activeFilter)

  const sorted = [...filtered].sort((a, b) => {
    const ai = urgencyOrder.indexOf(a.urgencyScore)
    const bi = urgencyOrder.indexOf(b.urgencyScore)
    if (ai !== bi) return ai - bi
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Case Queue</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            {incidents.filter((i) => i.status === 'PENDING').length} pending
          </span>
          <a
            href="/api/export/cases?format=csv"
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ⬇️ Export CSV
          </a>
        </div>
      </div>

      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as UrgencyLevel | 'ALL')}>
        <TabsList className="bg-orange-50">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="CRITICAL" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
            Critical
          </TabsTrigger>
          <TabsTrigger value="HIGH" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            High
          </TabsTrigger>
          <TabsTrigger value="MEDIUM" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800">
            Medium
          </TabsTrigger>
          <TabsTrigger value="LOW" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
            Low
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="rounded-xl border bg-white py-16 text-center text-gray-400">
            <p className="text-sm">No incidents in this category</p>
          </div>
        )}
        {sorted.map((incident) => (
          <div
            key={incident.id}
            className="flex items-start justify-between rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={urgencyColors[incident.urgencyScore]}>
                  {incident.urgencyScore}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {incident.status}
                </Badge>
              </div>
              <Link
                href={`/dashboard/cases/${incident.id}`}
                className="block text-sm font-semibold text-gray-900 hover:text-orange-600"
              >
                {incident.title}
              </Link>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {incident.city}
                  {incident.landmark ? `, ${incident.landmark}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            {incident.status === 'PENDING' && (
              <Button
                size="sm"
                onClick={() => acceptCase(incident.id)}
                disabled={accepting === incident.id}
                className="ml-4 bg-orange-500 hover:bg-orange-600 text-white shrink-0"
              >
                {accepting === incident.id ? 'Accepting…' : 'Accept'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
