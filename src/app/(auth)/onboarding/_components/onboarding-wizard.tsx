'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'

type Role = 'CITIZEN' | 'NGO_ADMIN' | 'VETERINARIAN' | 'SUPPLIER' | 'FIELD_WORKER'

interface RoleInfo {
  name: string
  description: string
  emoji: string
}

const ROLES: Record<Role, RoleInfo> = {
  CITIZEN: { name: 'Citizen', description: 'Report stray animals and sponsor rescues', emoji: '👤' },
  NGO_ADMIN: { name: 'NGO / Rescue Organization', description: 'Manage rescues and animal care', emoji: '🏥' },
  VETERINARIAN: { name: 'Veterinarian', description: 'Provide medical consultations', emoji: '🩺' },
  SUPPLIER: { name: 'Supplier', description: 'Supply food and medicine to NGOs', emoji: '📦' },
  FIELD_WORKER: { name: 'Field Worker', description: 'Join an NGO rescue team', emoji: '🦺' },
}

const INDIAN_METROS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Kolkata', 'Surat', 'Jaipur',
]

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ngos, setNgos] = useState<{ id: string; name: string; city: string | null }[]>([])

  // Fetch NGOs for FIELD_WORKER
  useEffect(() => {
    let mounted = true
    if (role === 'FIELD_WORKER') {
      fetch('/api/ngo')
        .then((res) => res.json())
        .then((data) => {
          if (mounted && Array.isArray(data)) setNgos(data)
        })
        .catch(console.error)
    }
    return () => { mounted = false }
  }, [role])

  const totalSteps = role === 'CITIZEN' ? 2 : 3

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleRoleSelect(selected: Role) {
    setRole(selected)
    if (selected === 'CITIZEN') {
      router.push('/report')
      return
    }
    setStep(2)
  }

  async function handleSubmit() {
    if (!role) return
    setSubmitting(true)
    setError(null)

    const endpointMap: Record<Role, string> = {
      CITIZEN: '/report',
      NGO_ADMIN: '/api/ngo/onboard',
      VETERINARIAN: '/api/vets/onboard',
      SUPPLIER: '/api/supplier/onboard',
      FIELD_WORKER: '/api/worker/onboard',
    }

    const endpoint = endpointMap[role]

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      setSubmitting(false)
      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json()
        const raw = data.error
        setError(
          typeof raw === 'string'
            ? raw
            : raw
              ? JSON.stringify(raw)
              : 'Something went wrong',
        )
      }
    } catch {
      setSubmitting(false)
      setError('Network error. Please try again.')
    }
  }

  const dashboardMap: Record<Role, string> = {
    CITIZEN: '/report',
    NGO_ADMIN: '/dashboard',
    VETERINARIAN: '/vet/dashboard',
    SUPPLIER: '/supplier/dashboard',
    FIELD_WORKER: '/worker/dashboard',
  }

  if (done && role) {
    return (
      <div className="text-center space-y-4 rounded-2xl bg-white p-10 shadow-sm max-w-md w-full mx-auto">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900">You&apos;re all set!</h1>
        <p className="text-gray-500 text-sm">Welcome to RESCURE. Your profile has been created.</p>
        <Button
          onClick={() => router.push(dashboardMap[role])}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-orange-600">RESCURE</h1>
        <p className="mt-1 text-gray-600">
          {role ? `Step ${step} of ${totalSteps}` : 'Get started'}
        </p>
      </div>

      {/* Progress bar */}
      {role && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s <= step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {s}
              </div>
              {s < totalSteps && (
                <div className={`h-0.5 w-8 transition-colors ${s < step ? 'bg-orange-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">What best describes you?</h2>
            <div className="space-y-2">
              {(Object.entries(ROLES) as [Role, RoleInfo][]).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleSelect(key)}
                  className="w-full flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-800">{info.name}</p>
                    <p className="text-sm text-gray-500">{info.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Role-specific form */}
        {step === 2 && role && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {role === 'NGO_ADMIN' && 'Organization Details'}
              {role === 'VETERINARIAN' && 'Veterinarian Details'}
              {role === 'SUPPLIER' && 'Supplier Details'}
              {role === 'FIELD_WORKER' && 'Field Worker Details'}
            </h2>

            {role === 'NGO_ADMIN' && (
              <>
                <div className="space-y-1">
                  <Label>Organization Name</Label>
                  <Input
                    placeholder="Animal Care Society"
                    value={formData.name ?? ''}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>City</Label>
                  <Select onValueChange={(v) => updateField('city', v)}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_METROS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Registration Number</Label>
                  <Input
                    placeholder="NGO/MH/2024/001"
                    value={formData.registrationNumber ?? ''}
                    onChange={(e) => updateField('registrationNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Coverage Area</Label>
                  <Input
                    placeholder="e.g. Mumbai, Thane, Navi Mumbai"
                    value={formData.coverageArea ?? ''}
                    onChange={(e) => updateField('coverageArea', e.target.value)}
                  />
                </div>
              </>
            )}

            {role === 'VETERINARIAN' && (
              <>
                <div className="space-y-1">
                  <Label>License Number</Label>
                  <Input
                    placeholder="VET/MH/2024/001"
                    value={formData.licenseNo ?? ''}
                    onChange={(e) => updateField('licenseNo', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Specialization</Label>
                  <Input
                    placeholder="Small animals, Wildlife, etc."
                    value={formData.specialization ?? ''}
                    onChange={(e) => updateField('specialization', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Available for emergencies?</Label>
                  <Select onValueChange={(v) => updateField('onCallAvailable', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {role === 'SUPPLIER' && (
              <>
                <div className="space-y-1">
                  <Label>Company Name</Label>
                  <Input
                    placeholder="PetCare Supplies Pvt Ltd"
                    value={formData.name ?? ''}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Product Categories</Label>
                  <Input
                    placeholder="food-dry, medicine, accessories"
                    value={formData.categories ?? ''}
                    onChange={(e) => updateField('categories', e.target.value)}
                  />
                </div>
              </>
            )}

            {role === 'FIELD_WORKER' && (
              <>
                <div className="space-y-1">
                  <Label>NGO to Join</Label>
                  <Select onValueChange={(v) => updateField('ngoId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={ngos.length === 0 ? "Loading NGOs..." : "Select an NGO"} />
                    </SelectTrigger>
                    <SelectContent>
                      {ngos.map((ngo) => (
                        <SelectItem key={ngo.id} value={ngo.id}>
                          {ngo.name} {ngo.city ? `(${ngo.city})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>City</Label>
                  <Select onValueChange={(v) => updateField('city', v)}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_METROS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-orange-200 text-orange-600"
              >
                ← Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Next: Review →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review + Submit */}
        {step === 3 && role && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Review &amp; Submit</h2>
            <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-medium w-28 text-gray-500">Role:</span>
                <span className="text-gray-800">{ROLES[role].name}</span>
              </div>
              {Object.entries(formData).map(([key, val]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-medium w-28 text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="text-gray-800">{val}</span>
                </div>
              ))}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 border-orange-200 text-orange-600"
              >
                ← Back
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {submitting ? 'Submitting…' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
