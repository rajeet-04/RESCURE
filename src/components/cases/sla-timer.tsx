'use client'

import { useEffect, useState } from 'react'

interface SlaData {
  deadline: string
  remaining: number
  breached: boolean
  urgency: string
  state: string
}

interface SlaTimerProps {
  caseId: string
  deadline: string | null
  urgency: string
  state: string
}

const RESOLVED_STATES = ['RELEASED', 'CLOSED', 'RESCUED']

function formatSeconds(seconds: number): string {
  const abs = Math.abs(seconds)
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const SLA_MINUTES: Record<string, number> = {
  CRITICAL: 30,
  HIGH: 120,
  MEDIUM: 360,
  LOW: 1440,
}

export default function SlaTimer({ caseId, deadline: initialDeadline, urgency, state }: SlaTimerProps) {
  const [sla, setSla] = useState<SlaData | null>(null)
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    fetch(`/api/cases/${caseId}/sla`)
      .then((r) => r.json())
      .then((data: SlaData) => {
        setSla(data)
        setRemaining(data.remaining)
      })
      .catch(() => {
        // fallback: compute from initialDeadline or urgency
        const slaMinutes = SLA_MINUTES[urgency] ?? 120
        const deadlineMs = initialDeadline
          ? new Date(initialDeadline).getTime()
          : Date.now() + slaMinutes * 60 * 1000
        const rem = Math.floor((deadlineMs - Date.now()) / 1000)
        setSla({
          deadline: new Date(deadlineMs).toISOString(),
          remaining: rem,
          breached: rem <= 0,
          urgency,
          state,
        })
        setRemaining(rem)
      })
  }, [caseId, initialDeadline, urgency, state])

  useEffect(() => {
    if (!sla) return
    if (RESOLVED_STATES.includes(sla.state)) return

    const interval = setInterval(() => {
      setRemaining((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [sla])

  if (!sla) {
    return <div className="animate-pulse rounded-lg bg-gray-100 h-10 w-48" />
  }

  if (RESOLVED_STATES.includes(sla.state)) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
        <span>✓</span>
        <span>Resolved</span>
      </div>
    )
  }

  const slaMinutes = SLA_MINUTES[sla.urgency] ?? 120
  const totalSeconds = slaMinutes * 60
  const elapsed = totalSeconds - remaining
  const pct = elapsed / totalSeconds

  let colorClass = 'bg-green-100 text-green-800'
  if (remaining <= 0) {
    colorClass = 'bg-red-100 text-red-800'
  } else if (pct > 0.75) {
    colorClass = 'bg-red-100 text-red-800'
  } else if (pct > 0.5) {
    colorClass = 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${colorClass}`}>
      {remaining <= 0 ? (
        <>
          <span>⚠</span>
          <span>SLA Breached {formatSeconds(remaining)} ago</span>
        </>
      ) : (
        <>
          <span>⏱</span>
          <span>{formatSeconds(remaining)} remaining</span>
        </>
      )}
    </div>
  )
}
