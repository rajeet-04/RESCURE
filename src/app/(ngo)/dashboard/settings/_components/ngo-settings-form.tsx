'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface NGOSettingsFormProps {
  ngo: {
    id: string
    name: string
    description: string | null
    city: string | null
    state: string | null
    registrationNo: string | null
  }
}

export default function NGOSettingsForm({ ngo }: NGOSettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    setSaving(true)

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      city: form.get('city') as string,
      state: form.get('state') as string,
      registrationNo: form.get('registrationNo') as string,
    }

    try {
      const res = await fetch('/api/ngo/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to save settings.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="name">Organisation Name *</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={ngo.name}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={ngo.description ?? ''}
          className={inputClass}
          placeholder="Tell us about your organisation's mission…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={ngo.city ?? ''}
            className={inputClass}
            placeholder="e.g. Mumbai"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="state">State</label>
          <input
            id="state"
            name="state"
            type="text"
            defaultValue={ngo.state ?? ''}
            className={inputClass}
            placeholder="e.g. Maharashtra"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="registrationNo">Registration Number</label>
        <input
          id="registrationNo"
          name="registrationNo"
          type="text"
          defaultValue={ngo.registrationNo ?? ''}
          className={inputClass}
          placeholder="NGO registration / FCRA number"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          Settings saved successfully.
        </p>
      )}

      <Button
        type="submit"
        disabled={saving}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : 'Save Changes'}
      </Button>
    </form>
  )
}
