'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function MilestoneForm({ animalId }: { animalId: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/animals/${animalId}/milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone: text }),
      })
      const data = await res.json() as { notified?: number; error?: string }
      if (res.ok) {
        setMessage(`✅ Notified ${data.notified ?? 0} sponsor(s)`)
        setText('')
        setOpen(false)
      } else {
        setMessage(`❌ ${data.error ?? 'Failed to send'}`)
      }
    } catch {
      setMessage('❌ Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-block">
      {!open ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          🏅 Send Milestone
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Tommy got vaccinated today!"
            className="border rounded-md px-3 py-1.5 text-sm w-64"
            required
            autoFocus
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </form>
      )}
      {message && (
        <p className="text-xs mt-1 text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
