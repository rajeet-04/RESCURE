'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  licenseNo: z.string().min(1, 'License number is required'),
  specialization: z.string().optional(),
  city: z.string().optional(),
  licenseDoc: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function VetOnboardingPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setValue('licenseDoc', data.url)
      }
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setError(null)
    const res = await fetch('/api/vets/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      router.push('/vet/dashboard')
    } else {
      const err = await res.json()
      setError(err.error ?? 'Onboarding failed')
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Vet Onboarding</CardTitle>
          <p className="text-sm text-muted-foreground">Complete your profile to start accepting consultations.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>License Number *</Label>
              <Input {...register('licenseNo')} placeholder="e.g. VET-MH-2023-001" />
              {errors.licenseNo && <p className="text-xs text-red-500">{errors.licenseNo.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Specialization</Label>
              <Input {...register('specialization')} placeholder="e.g. Small animals, Wildlife" />
            </div>

            <div className="space-y-1">
              <Label>City</Label>
              <Input {...register('city')} placeholder="e.g. Mumbai" />
            </div>

            <div className="space-y-1">
              <Label>License Document (optional)</Label>
              <Input type="file" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={isSubmitting || uploading} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
