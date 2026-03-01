'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CASE_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESCUED', 'TREATED', 'RELEASED', 'ADOPTED', 'CLOSED'] as const

interface Worker {
  id: string
  name: string
}

interface CaseStatusFormProps {
  caseId: string
  currentStatus: string
  workers: Worker[]
  assignedWorkerId: string | null
}

export default function CaseStatusForm({
  caseId,
  currentStatus,
  workers,
  assignedWorkerId,
}: CaseStatusFormProps) {
  const [status, setStatus] = useState(currentStatus)
  const [workerId, setWorkerId] = useState(assignedWorkerId ?? '__none__')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, assignedWorkerId: workerId === '__none__' ? null : workerId }),
    })

    setSubmitting(false)
    if (res.ok) {
      setSuccess(true)
      setNote('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Update failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="border-orange-200 focus:ring-orange-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {workers.length > 0 && (
          <div className="space-y-1">
            <Label>Assign Worker</Label>
            <Select value={workerId} onValueChange={setWorkerId}>
              <SelectTrigger className="border-orange-200 focus:ring-orange-400">
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {workers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="note">Notes</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an update note (optional)…"
          rows={3}
          className="border-orange-200 focus:ring-orange-400"
        />
      </div>

      {success && (
        <p className="text-sm text-green-600">✅ Status updated successfully</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="bg-orange-500 hover:bg-orange-600 text-white"
      >
        {submitting ? 'Updating…' : 'Update Case'}
      </Button>
    </form>
  )
}
