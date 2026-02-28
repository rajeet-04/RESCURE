'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import Image from 'next/image'
import { AlertTriangle, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { ScrollAnimationObserver } from '@/components/ScrollAnimationObserver'

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
  CRITICAL: 'bg-critical text-white',
  HIGH: 'bg-warning text-white',
  MEDIUM: 'bg-primary text-white',
  LOW: 'bg-success text-white',
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
    <main className="min-h-screen bg-gray-50 relative overflow-hidden">
      <ScrollAnimationObserver />

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="RESCURE" width={40} height={40} className="rounded-full" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">rescure</h1>
              <p className="text-sm text-gray-500">Emergency Animal Report</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12 relative z-1">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2.5 rounded-full mb-6 border border-primary/20 scroll-zoom-in pulse-glow">
            <AlertCircle className="h-4 w-4" />
            EMERGENCY RESCUE REQUEST
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 scroll-reveal delay-100">
            Report an Animal in Need
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed scroll-fade delay-200">
            Your report will be instantly sent to nearby verified NGOs and rescue teams. Help arrives within 15 minutes on average.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Animal Information Section */}
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 scroll-reveal hover-lift">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Animal Information</h3>
              <p className="text-sm text-gray-600">Tell us about the animal that needs help</p>
            </div>

            <div className="space-y-6">
              {/* Animal Type */}
              <div className="space-y-2">
                <Label htmlFor="animalType" className="text-sm font-semibold text-gray-700">Animal Type</Label>
                <Select defaultValue="Dog" onValueChange={(v) => setValue('animalType', v as ReportForm['animalType'])}>
                  <SelectTrigger id="animalType" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                    <SelectItem value="Cow">Cow</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">What happened?</Label>
                <Input
                  id="title"
                  placeholder="e.g. Injured dog, unable to walk"
                  className="h-12"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-600 font-medium">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the animal's condition, visible injuries, behavior, and any immediate dangers…"
                  rows={5}
                  className="resize-none"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-600 font-medium">{errors.description.message}</p>}
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Photos</Label>
                <p className="text-xs text-gray-500 mb-3">Clear photos help rescue teams assess urgency and prepare appropriate equipment</p>
                <ImageUploader onImagesUploaded={setImageUrls} />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 scroll-reveal delay-200 hover-lift">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Location Details</h3>
              <p className="text-sm text-gray-600">Precise location helps teams reach the animal faster</p>
            </div>

            <div className="space-y-6">
              {/* Location Picker */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Map Location</Label>
                <LocationPicker
                  onLocation={(lat, lng, geohash) => setLocation({ lat, lng, geohash })}
                />
              </div>

              {/* City + Landmark */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700">City</Label>
                  <Input
                    id="city"
                    placeholder="Mumbai"
                    className="h-12"
                    {...register('city')}
                  />
                  {errors.city && <p className="text-xs text-red-600 font-medium">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landmark" className="text-sm font-semibold text-gray-700">Landmark (optional)</Label>
                  <Input
                    id="landmark"
                    placeholder="Near central junction"
                    className="h-12"
                    {...register('landmark')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reporter Information Section */}
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 scroll-reveal delay-300 hover-lift">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Contact Information</h3>
              <p className="text-sm text-gray-600">Optional, but helps rescue teams reach you for updates or additional information</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reporterName" className="text-sm font-semibold text-gray-700">Your Name</Label>
                <Input
                  id="reporterName"
                  placeholder="John Doe"
                  className="h-12"
                  {...register('reporterName')}
                />
                {errors.reporterName && <p className="text-xs text-red-600 font-medium">{errors.reporterName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporterPhone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                <Input
                  id="reporterPhone"
                  placeholder="+91 XXXXX XXXXX"
                  className="h-12"
                  {...register('reporterPhone')}
                />
                {errors.reporterPhone && <p className="text-xs text-red-600 font-medium">{errors.reporterPhone.message}</p>}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-5 scroll-zoom-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Submission Failed</h4>
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {urgencyResult && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-5 scroll-zoom-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Report Submitted Successfully!</h4>
                  <p className="text-sm text-gray-700 mb-3">Your emergency report has been sent to nearby rescue teams. They&apos;ll respond shortly.</p>
                  <Badge className={urgencyColors[urgencyResult.urgencyScore]}>
                    Urgency: {urgencyResult.urgencyScore}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="space-y-4 scroll-zoom-in delay-400">
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full h-14 bg-gray-900 text-white rounded-full font-semibold text-base hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting Emergency Report...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Submit Emergency Report</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Info Footer */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Average response time: <span className="text-primary font-bold">15 minutes</span></span>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
