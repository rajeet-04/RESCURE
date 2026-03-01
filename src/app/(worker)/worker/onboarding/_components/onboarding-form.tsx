'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface NGO {
  id: string
  name: string
  city: string | null
}

interface OnboardingFormProps {
  ngos: NGO[]
  defaultNgoId?: string
}

export default function OnboardingForm({ ngos, defaultNgoId }: OnboardingFormProps) {
  const router = useRouter()
  const [selectedNgoId, setSelectedNgoId] = useState(defaultNgoId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNgoId) {
      setError('Please select an NGO')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/worker/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoId: selectedNgoId }),
      })
      if (res.ok) {
        router.push('/worker/dashboard')
      } else {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="ngo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select your NGO
          </label>
          <select
            id="ngo"
            value={selectedNgoId}
            onChange={(e) => setSelectedNgoId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">-- Choose an NGO --</option>
            {ngos.map((ngo) => (
              <option key={ngo.id} value={ngo.id}>
                {ngo.name}
                {ngo.city ? ` · ${ngo.city}` : ''}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          {loading ? 'Setting up…' : 'Get Started'}
        </Button>
      </form>
    </Card>
  )
}
