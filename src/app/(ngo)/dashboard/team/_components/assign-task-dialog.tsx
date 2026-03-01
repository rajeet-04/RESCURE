'use client'

import { useEffect, useState } from 'react'
import { Loader2, ClipboardList, MapPin, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UnassignedCase {
  id: string
  state: string
  createdAt: string
  report: {
    address: string | null
    description: string | null
    urgencyScore: string
    animalType: string | null
    photos: string[]
  }
}

interface AssignTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workerId: string
  workerName: string
  onAssigned?: () => void
}

const urgencyColor: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
}

export default function AssignTaskDialog({
  open,
  onOpenChange,
  workerId,
  workerName,
  onAssigned,
}: AssignTaskDialogProps) {
  const [cases, setCases] = useState<UnassignedCase[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    fetch('/api/ngo/team/cases')
      .then((r) => r.json())
      .then((data) => {
        setCases(Array.isArray(data) ? data : [])
      })
      .catch(() => setError('Failed to load cases.'))
      .finally(() => setLoading(false))
  }, [open])

  async function handleAssign(caseId: string) {
    setAssigning(caseId)
    setError(null)
    try {
      const res = await fetch('/api/ngo/team/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, workerId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to assign task')
      }
      setSuccess(`Task assigned to ${workerName}!`)
      setCases((prev) => prev.filter((c) => c.id !== caseId))
      onAssigned?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assignment failed')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>Assign Rescue Task</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            Select an unassigned case to assign to <strong>{workerName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          {!loading && !error && cases.length === 0 && !success && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <ClipboardList className="h-8 w-8" />
              <p className="text-sm">No unassigned cases right now.</p>
            </div>
          )}

          {cases.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {c.report.animalType ?? 'Unknown animal'}
                  </p>
                  {c.report.address && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.report.address}</span>
                    </div>
                  )}
                  {c.report.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">{c.report.description}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${urgencyColor[c.report.urgencyScore] ?? ''}`}
                >
                  {c.report.urgencyScore}
                </Badge>
              </div>

              <Button
                size="sm"
                className="w-full"
                disabled={assigning === c.id}
                onClick={() => handleAssign(c.id)}
              >
                {assigning === c.id ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Assigning…
                  </>
                ) : (
                  `Assign to ${workerName}`
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
