'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function HandoffDialog({ animalId }: { animalId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [targetNgoId, setTargetNgoId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetNgoId.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/animals/${animalId}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetNgoId: targetNgoId.trim(), reason: reason.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Handoff failed')
        return
      }

      setOpen(false)
      router.push('/dashboard/animals')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Handoff to Another NGO</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Handoff Animal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="targetNgoId">Target NGO ID</Label>
            <Input
              id="targetNgoId"
              value={targetNgoId}
              onChange={(e) => setTargetNgoId(e.target.value)}
              placeholder="Enter the receiving NGO's ID"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for handoff..."
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !targetNgoId.trim()}>
              {loading ? 'Processing...' : 'Confirm Handoff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
