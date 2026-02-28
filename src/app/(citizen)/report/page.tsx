'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import LocationPicker from '@/components/report/location-picker'
import ImageUploader from '@/components/report/image-uploader'
import { saveOfflineReport } from '@/lib/offline/report-queue'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

const reportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Please describe the situation in more detail'),
  animalType: z.enum(['Dog', 'Cat', 'Cow', 'Other']),
  reporterName: z.string().min(2, 'Name required'),
  reporterPhone: z.string().min(10, 'Valid phone number required'),
  city: z.string().min(2, 'City required'),
  landmark: z.string().optional(),
})

type ReportForm = z.infer<typeof reportSchema>

const urgencyColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-green-100 text-green-800 border-green-300',
}

export default function ReportPage() {
  const router = useRouter()
  const [location, setLocation] = useState<{ lat: number; lng: number; geohash: string } | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [urgencyResult, setUrgencyResult] = useState<{ urgencyScore: string } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: { animalType: 'Dog' },
  })

  async function onSubmit(values: ReportForm) {
    setSubmitting(true)
    setSubmitError(null)

    const payload = {
      title: `${values.animalType} — ${values.title}`,
      description: values.description,
      latitude: location?.lat ?? 0,
      longitude: location?.lng ?? 0,
      geohash: location?.geohash ?? 'tttttt000',
      imageUrls,
      reporterName: values.reporterName,
      reporterPhone: values.reporterPhone,
      city: values.city,
      landmark: values.landmark,
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 409) {
        const data = await res.json()
        router.push(`/report/${data.existingId}`)
        return
      }

      if (!res.ok) throw new Error('Submission failed')

      const incident = await res.json()
      setUrgencyResult({ urgencyScore: incident.urgencyScore ?? 'MEDIUM' })

      setTimeout(() => router.push(`/report/${incident.id}`), 1500)
    } catch {
      try {
        await saveOfflineReport({
          id: `offline-${Date.now()}`,
          data: payload,
          createdAt: Date.now(),
          synced: false,
        })
        setSubmitError('You appear to be offline. Your report has been saved and will be submitted when you reconnect.')
      } catch {
        setSubmitError('Submission failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-orange-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-600">RESCURE</h1>
          <p className="mt-1 text-gray-600">Report a stray animal in distress</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
          {/* Animal Type */}
          <div className="space-y-1">
            <Label htmlFor="animalType">Animal Type</Label>
            <Select defaultValue="Dog" onValueChange={(v) => setValue('animalType', v as ReportForm['animalType'])}>
              <SelectTrigger id="animalType" className="border-orange-200 focus:ring-orange-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dog">🐕 Dog</SelectItem>
                <SelectItem value="Cat">🐈 Cat</SelectItem>
                <SelectItem value="Cow">🐄 Cow</SelectItem>
                <SelectItem value="Other">🐾 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">What happened?</Label>
            <Input
              id="title"
              placeholder="e.g. Injured dog on street, unable to walk"
              {...register('title')}
              className="border-orange-200 focus:ring-orange-400"
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the animal's condition, injuries, behaviour…"
              rows={4}
              {...register('description')}
              className="border-orange-200 focus:ring-orange-400"
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          {/* Location */}
          <div className="space-y-1">
            <Label>Location</Label>
            <LocationPicker
              onLocation={(lat, lng, geohash) => setLocation({ lat, lng, geohash })}
            />
          </div>

          {/* City + Landmark */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Mumbai"
                {...register('city')}
                className="border-orange-200 focus:ring-orange-400"
              />
              {errors.city && <p className="text-xs text-red-600">{errors.city.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="landmark">Landmark (optional)</Label>
              <Input
                id="landmark"
                placeholder="Near XYZ junction"
                {...register('landmark')}
                className="border-orange-200 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-1">
            <Label>Photos (optional)</Label>
            <ImageUploader onImagesUploaded={setImageUrls} />
          </div>

          {/* Reporter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="reporterName">Your Name</Label>
              <Input
                id="reporterName"
                placeholder="Full name"
                {...register('reporterName')}
                className="border-orange-200 focus:ring-orange-400"
              />
              {errors.reporterName && <p className="text-xs text-red-600">{errors.reporterName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="reporterPhone">Phone Number</Label>
              <Input
                id="reporterPhone"
                placeholder="+91 98765 43210"
                {...register('reporterPhone')}
                className="border-orange-200 focus:ring-orange-400"
              />
              {errors.reporterPhone && <p className="text-xs text-red-600">{errors.reporterPhone.message}</p>}
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          {urgencyResult && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">Report submitted!</span>
              <Badge className={urgencyColors[urgencyResult.urgencyScore]}>
                {urgencyResult.urgencyScore}
              </Badge>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </form>
      </div>
    </main>
  )
}
