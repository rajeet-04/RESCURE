'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WhitelabelConfig {
  appName: string
  primaryColor: string
  tagline: string
  logo?: string
}

interface WhitelabelFormProps {
  initialConfig: WhitelabelConfig
}

export default function WhitelabelForm({ initialConfig }: WhitelabelFormProps) {
  const [appName, setAppName] = useState(initialConfig.appName)
  const [primaryColor, setPrimaryColor] = useState(initialConfig.primaryColor)
  const [tagline, setTagline] = useState(initialConfig.tagline)
  const [logo, setLogo] = useState(initialConfig.logo ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    const res = await fetch('/api/admin/whitelabel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appName, primaryColor, tagline, logo: logo || undefined }),
    })

    setSaving(false)
    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="appName">App Name</Label>
        <Input
          id="appName"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="RESCURE"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Rescue. Recover. Reunite."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="primaryColor">Primary Color</Label>
        <div className="flex items-center gap-3">
          <input
            id="primaryColor"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-gray-200"
          />
          <Input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#f97316"
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="logo">Logo URL</Label>
        <Input
          id="logo"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://cdn.example.com/logo.png"
        />
      </div>

      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 font-medium">
          ✓ Config saved!
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button
        type="submit"
        disabled={saving}
        className="bg-orange-500 hover:bg-orange-600 text-white"
      >
        {saving ? 'Saving…' : 'Save Configuration'}
      </Button>
    </form>
  )
}
