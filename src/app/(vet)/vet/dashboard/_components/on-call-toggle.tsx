'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface OnCallToggleProps {
  vetId: string
  initialOnCall: boolean
}

export default function OnCallToggle({ vetId, initialOnCall }: OnCallToggleProps) {
  const [onCall, setOnCall] = useState(initialOnCall)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/vets/${vetId}/oncall`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onCallAvailable: !onCall }),
      })
      if (res.ok) setOnCall(!onCall)
    })
  }

  return (
    <Button
      variant={onCall ? 'default' : 'outline'}
      onClick={toggle}
      disabled={isPending}
      className={onCall ? 'bg-green-600 hover:bg-green-700' : ''}
    >
      {onCall ? '🟢 On Call' : '⚪ Off Call'}
    </Button>
  )
}
