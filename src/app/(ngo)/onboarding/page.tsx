'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const INDIAN_METROS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Kolkata', 'Surat', 'Jaipur',
]

const step1Schema = z.object({
  name: z.string().min(3, 'Organization name required'),
  city: z.string().min(2, 'City required'),
  phone: z.string().min(10, 'Valid phone required'),
  registrationNumber: z.string().min(3, 'Registration number required'),
})

const step3Schema = z.object({
  teamSize: z.string().min(1, 'Team size required'),
  primaryContact: z.string().min(2, 'Primary contact name required'),
})

type Step1 = z.infer<typeof step1Schema>
type Step3 = z.infer<typeof step3Schema>

export default function NGOOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1 | null>(null)
  const [coverageCities, setCoverageCities] = useState<string[]>([])
  const [coverageError, setCoverageError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register: reg1,
    handleSubmit: submit1,
    setValue: setVal1,
    formState: { errors: err1 },
  } = useForm<Step1>({ resolver: zodResolver(step1Schema) })

  const {
    register: reg3,
    handleSubmit: submit3,
    formState: { errors: err3 },
  } = useForm<Step3>({ resolver: zodResolver(step3Schema) })

  function toggleCity(city: string) {
    setCoverageCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    )
    setCoverageError(null)
  }

  function onStep1(data: Step1) {
    setStep1Data(data)
    setStep(2)
  }

  function onStep2() {
    if (coverageCities.length === 0) {
      setCoverageError('Select at least one coverage city')
      return
    }
    setStep(3)
  }

  async function onStep3(data: Step3) {
    if (!step1Data) return
    setSubmitting(true)
    setApiError(null)

    const res = await fetch('/api/ngo/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...step1Data,
        coverageCities,
        teamSize: data.teamSize,
        primaryContact: data.primaryContact,
      }),
    })

    setSubmitting(false)
    if (res.ok) {
      setDone(true)
    } else {
      const err = await res.json()
      setApiError(err.error ?? 'Something went wrong')
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="text-center space-y-4 rounded-2xl bg-white p-10 shadow-sm max-w-md w-full mx-4">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re all set!</h1>
          <p className="text-gray-500 text-sm">Your NGO is registered on RESCURE. Start responding to animals in need.</p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-orange-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-orange-600">RESCURE</h1>
          <p className="mt-1 text-gray-600">NGO Onboarding — Step {step} of 3</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s <= step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 ${s < step ? 'bg-orange-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {/* Step 1: Organization Details */}
          {step === 1 && (
            <form onSubmit={submit1(onStep1)} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Organization Details</h2>

              <div className="space-y-1">
                <Label htmlFor="name">Organization Name</Label>
                <Input id="name" placeholder="Animal Care Society" {...reg1('name')} className="border-orange-200 focus:ring-orange-400" />
                {err1.name && <p className="text-xs text-red-600">{err1.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>City</Label>
                <Select onValueChange={(v) => setVal1('city', v)}>
                  <SelectTrigger className="border-orange-200 focus:ring-orange-400">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_METROS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err1.city && <p className="text-xs text-red-600">{err1.city.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" {...reg1('phone')} className="border-orange-200 focus:ring-orange-400" />
                {err1.phone && <p className="text-xs text-red-600">{err1.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input id="registrationNumber" placeholder="NGO/MH/2024/001" {...reg1('registrationNumber')} className="border-orange-200 focus:ring-orange-400" />
                {err1.registrationNumber && <p className="text-xs text-red-600">{err1.registrationNumber.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Next: Coverage Area →
              </Button>
            </form>
          )}

          {/* Step 2: Coverage Area */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Coverage Area</h2>
              <p className="text-sm text-gray-500">Select the cities your NGO covers:</p>

              <div className="grid grid-cols-2 gap-2">
                {INDIAN_METROS.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      coverageCities.includes(city)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-orange-300'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {coverageError && <p className="text-sm text-red-600">{coverageError}</p>}

              <div className="flex gap-3">
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
                  onClick={onStep2}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Next: Team Setup →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Team Setup */}
          {step === 3 && (
            <form onSubmit={submit3(onStep3)} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Team Setup</h2>

              <div className="space-y-1">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input id="teamSize" type="number" min={1} placeholder="5" {...reg3('teamSize')} className="border-orange-200 focus:ring-orange-400" />
                {err3.teamSize && <p className="text-xs text-red-600">{err3.teamSize.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="primaryContact">Primary Contact Name</Label>
                <Input id="primaryContact" placeholder="Dr. Priya Sharma" {...reg3('primaryContact')} className="border-orange-200 focus:ring-orange-400" />
                {err3.primaryContact && <p className="text-xs text-red-600">{err3.primaryContact.message}</p>}
              </div>

              {apiError && <p className="text-sm text-red-600">{apiError}</p>}

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
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {submitting ? 'Submitting…' : 'Register NGO'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
