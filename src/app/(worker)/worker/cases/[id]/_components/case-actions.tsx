'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ReportStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'RESCUED'
  | 'IN_CARE'
  | 'RELEASED'
  | 'CLOSED'
  | 'DUPLICATE'

interface Transition {
  label: string
  nextState: ReportStatus
}

const TRANSITIONS: Partial<Record<ReportStatus, Transition>> = {
  ASSIGNED: { label: 'Head Out', nextState: 'EN_ROUTE' },
  EN_ROUTE: { label: 'Animal Rescued', nextState: 'RESCUED' },
  RESCUED: { label: 'In Care', nextState: 'IN_CARE' },
  IN_CARE: { label: 'Release', nextState: 'RELEASED' },
}

interface CaseActionsProps {
  caseId: string
  currentState: ReportStatus
}

export default function CaseActions({
  caseId,
  currentState,
}: CaseActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const transition = TRANSITIONS[currentState]
  if (!transition) return null

  const { label, nextState } = transition

  async function handleAction() {
    setLoading(true)
    try {
      await fetch(`/api/worker/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleAction}
      disabled={loading}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
    >
      {loading ? 'Updating…' : label}
    </Button>
  )
}
