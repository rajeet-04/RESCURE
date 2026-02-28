'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = {
  animalId: string
  planAmount: number
  planLabel: string
}

export default function SponsorButton({ animalId, planAmount, planLabel }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSponsor() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalId, planAmount, planLabel }),
      })

      if (res.status === 401) {
        router.push(`/login?callbackUrl=/adopt/${animalId}`)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Something went wrong.')
        return
      }

      setConfirmed(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 text-green-700 font-medium text-sm py-2">
        <span className="text-xl">✅</span>
        <span>🎉 Sponsorship Confirmed!</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Button
        onClick={handleSponsor}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
      >
        {loading ? 'Processing…' : `Sponsor — ${planLabel}`}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
