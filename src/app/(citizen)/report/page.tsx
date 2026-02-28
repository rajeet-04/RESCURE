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
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Heart,
  Camera,
  MapPin,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { ScrollAnimationObserver } from '@/components/ScrollAnimationObserver'

// ── Step 2 form schema ────────────────────────────────────────────────────────
const reviewSchema = z.object({
  animalType: z.string().min(1),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Please describe the situation in more detail'),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  city: z.string().min(2, 'City required'),
  landmark: z.string().optional(),
})
type ReviewForm = z.infer<typeof reviewSchema>

// ── Wizard state machine ──────────────────────────────────────────────────────
type WizardState = 'capture' | 'analyzing' | 'review' | 'submitted'

const URGENCY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-blue-500 text-white',
  LOW: 'bg-green-500 text-white',
}

const ANIMAL_OPTIONS = ['Dog', 'Cat', 'Bird', 'Cow', 'Horse', 'Monkey', 'Snake', 'Wildlife', 'Other']

export default function ReportPage() {
  const router = useRouter()

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [location, setLocation] = useState<{ lat: number; lng: number; geohash: string } | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [step1Error, setStep1Error] = useState<string | null>(null)

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [wizardState, setWizardState] = useState<WizardState>('capture')
  const [incidentId, setIncidentId] = useState<string | null>(null)
  const [aiUrgency, setAiUrgency] = useState<string>('MEDIUM')
  const [aiConfidence, setAiConfidence] = useState<number>(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Step 2 form ───────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { animalType: 'Dog' },
  })

  // ── Step 1 → Create incident + trigger AI analysis ────────────────────────
  async function handleCapture() {
    setStep1Error(null)

    if (!location) {
      setStep1Error('Please share your location so rescue teams can find the animal.')
      return
    }
    if (imageUrls.length === 0) {
      setStep1Error('Please upload at least one photo of the animal.')
      return
    }

    setWizardState('analyzing')

    try {
      // 1. Create the incident with only photo + location
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          geohash: location.geohash,
          photos: imageUrls,
        }),
      })

      if (res.status === 409) {
        const data = await res.json()
        router.push(`/report/${data.existingId}`)
        return
      }

      if (!res.ok) throw new Error('Failed to create incident')

      const incident = await res.json()
      setIncidentId(incident.id)

      // 2. Call analyze explicitly so we can await AI prefill data
      const analyzeRes = await fetch(`/api/incidents/${incident.id}/analyze`, {
        method: 'POST',
      })

      if (analyzeRes.ok) {
        const analysis = await analyzeRes.json()
        setAiUrgency(analysis.urgency ?? 'MEDIUM')
        setAiConfidence(analysis.confidence ?? 0)
        // Pre-fill form with AI suggestions
        setValue('animalType', analysis.animalType ?? 'Other')
        setValue('title', analysis.suggestedTitle ?? '')
        setValue('description', analysis.suggestedDescription ?? '')
      }

      setWizardState('review')
    } catch (err) {
      console.error(err)
      // Offline fallback — save and proceed without AI data
      try {
        await saveOfflineReport({
          id: `offline-${Date.now()}`,
          data: {
            title: '',
            description: '',
            latitude: location.lat,
            longitude: location.lng,
            geohash: location.geohash,
            imageUrls,
            reporterName: '',
            reporterPhone: '',
            city: '',
          },
          createdAt: Date.now(),
          synced: false,
        })
        setStep1Error(
          'You appear to be offline. Your report has been saved and will be submitted when you reconnect.'
        )
        setWizardState('capture')
      } catch {
        setStep1Error('Submission failed. Please try again.')
        setWizardState('capture')
      }
    }
  }

  // ── Step 2 → PATCH wizard fields ──────────────────────────────────────────
  async function onReviewSubmit(values: ReviewForm) {
    if (!incidentId) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          animalType: values.animalType,
          reporterName: values.reporterName || undefined,
          reporterPhone: values.reporterPhone || undefined,
          city: values.city,
          landmark: values.landmark || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to update report')

      setWizardState('submitted')
      setTimeout(() => router.push(`/report/${incidentId}`), 2500)
    } catch {
      setSubmitError('Could not save your details. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">
      <ScrollAnimationObserver />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="mx-auto max-w-xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">rescure</h1>
              <p className="text-xs text-gray-500">Emergency Animal Report</p>
            </div>

            {/* Step indicator */}
            {(wizardState === 'capture' || wizardState === 'analyzing' || wizardState === 'review') && (
              <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                <span className={wizardState === 'capture' ? 'text-primary font-semibold' : 'text-gray-400'}>
                  1 Photo &amp; Location
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className={wizardState === 'review' ? 'text-primary font-semibold' : 'text-gray-400'}>
                  2 Review
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 py-10">

        {/* ── STEP 1: Capture ─────────────────────────────────────────────── */}
        {wizardState === 'capture' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-4 py-2 rounded-full mb-4 border border-primary/20">
                <AlertCircle className="h-4 w-4" />
                STEP 1 OF 2
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Photo &amp; Location</h2>
              <p className="text-gray-500 text-sm">
                Our AI will analyze the photo to pre-fill the rest of the report for you.
              </p>
            </div>

            {/* Photo upload */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Animal Photo</h3>
                <span className="text-xs text-red-500 font-medium">required</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Upload a clear photo — our AI will identify the animal type and assess injury severity.
              </p>
              <ImageUploader onImagesUploaded={setImageUrls} />
            </div>

            {/* Location */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Location</h3>
                <span className="text-xs text-red-500 font-medium">required</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Rescue teams need your precise GPS location. Tap the button to share it.
              </p>
              <LocationPicker
                onLocation={(lat, lng, geohash) => setLocation({ lat, lng, geohash })}
              />
              {location && (
                <p className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Location captured: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </div>

            {step1Error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{step1Error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleCapture}
              className="group w-full h-14 bg-gray-900 text-white rounded-full font-semibold text-base hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Analyse &amp; Continue
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* ── ANALYZING ───────────────────────────────────────────────────── */}
        {wizardState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Photo…</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Our AI is assessing the animal&apos;s condition and alerting nearby rescue teams.
                This takes about 5–10 seconds.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Notifying nearby NGOs and shelters
            </div>
          </div>
        )}

        {/* ── STEP 2: Review ──────────────────────────────────────────────── */}
        {wizardState === 'review' && (
          <form onSubmit={handleSubmit(onReviewSubmit)} className="space-y-6">
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-bold px-4 py-2 rounded-full mb-4 border border-green-200">
                <Sparkles className="h-4 w-4" />
                AI ANALYSIS COMPLETE
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Report</h2>
              <p className="text-gray-500 text-sm">
                We pre-filled the form based on the photo. Please review and correct anything.
              </p>
            </div>

            {/* AI urgency banner */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 shadow-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">AI-assessed urgency</p>
                <Badge className={URGENCY_BADGE[aiUrgency] ?? 'bg-gray-400 text-white'}>
                  {aiUrgency}
                </Badge>
              </div>
              {aiConfidence > 0 && (
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="text-sm font-bold text-gray-800">{aiConfidence}%</p>
                </div>
              )}
            </div>

            {/* Animal details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-900">Animal Details</h3>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Animal Type</Label>
                <Select
                  value={watch('animalType')}
                  onValueChange={(v) => setValue('animalType', v)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMAL_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  What happened?
                </Label>
                <Input
                  placeholder="e.g. Injured dog unable to walk"
                  className="h-11"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Description
                </Label>
                <Textarea
                  placeholder="Describe the animal's condition, injuries, and any surrounding dangers…"
                  rows={4}
                  className="resize-none"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Location details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-900">Location Details</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">City</Label>
                  <Input
                    placeholder="Mumbai"
                    className="h-11"
                    {...register('city')}
                  />
                  {errors.city && <p className="text-xs text-red-600">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Landmark</Label>
                  <Input
                    placeholder="Near railway station"
                    className="h-11"
                    {...register('landmark')}
                  />
                </div>
              </div>
            </div>

            {/* Reporter info */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Your Contact (optional)</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Helps rescue teams reach you for updates.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</Label>
                  <Input
                    placeholder="Your name"
                    className="h-11"
                    {...register('reporterName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Phone</Label>
                  <Input
                    placeholder="+91 XXXXX XXXXX"
                    className="h-11"
                    {...register('reporterPhone')}
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group w-full h-14 bg-gray-900 text-white rounded-full font-semibold text-base hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  Submit Emergency Report
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── SUBMITTED ───────────────────────────────────────────────────── */}
        {wizardState === 'submitted' && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Nearby rescue teams and animal shelters have been notified. Average response time
                is <strong className="text-primary">15 minutes</strong>.
              </p>
            </div>
            <Badge className={URGENCY_BADGE[aiUrgency] ?? 'bg-gray-400 text-white'}>
              Urgency: {aiUrgency}
            </Badge>
            <p className="text-xs text-gray-400">Redirecting to your tracking page…</p>
          </div>
        )}
      </div>
    </main>
  )
}


