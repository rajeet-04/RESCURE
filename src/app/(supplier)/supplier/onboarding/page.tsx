'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function SupplierOnboardingPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!businessName.trim()) {
      setError('Business name is required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/supplier/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName.trim(),
          description: description.trim() || undefined,
          city: city.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Failed to register.')
        return
      }

      router.push('/supplier/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Register as Supplier</h1>
        <p className="text-gray-500 mt-1 text-sm">
          List your products on the RESCURE marketplace and sell to NGOs at verified prices.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. PetCo Supplies"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell NGOs about your business and products…"
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Mumbai"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          {loading ? 'Registering…' : 'Register as Supplier'}
        </Button>
      </form>
    </div>
  )
}
