'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Star,
  MapPin,
  Phone,
  Stethoscope,
  AlertTriangle,
  X,
  ImagePlus,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Clock,
  ChevronRight,
  User,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

type Vet = {
  id: string
  licenseNo: string
  specialization: string | null
  city: string | null
  rating: number | null
  totalConsultations: number
  onCallAvailable: boolean
  user: { name: string | null; image: string | null }
}

type Animal = {
  id: string
  name: string | null
  species: string
  breed: string | null
}

type ConsultationMessage = {
  id: string
  senderId: string
  content: string
  createdAt: string
}

type Consultation = {
  id: string
  status: string
  isEmergency: boolean
  question: string
  createdAt: string
  animal: { name: string | null; species: string } | null
  vet: { user: { name: string | null }; specialization: string | null } | null
  messages: ConsultationMessage[]
}

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  OPEN:        { cls: 'bg-blue-100 text-blue-700',   label: 'Open' },
  IN_PROGRESS: { cls: 'bg-orange-100 text-orange-700', label: 'In Progress' },
  RESOLVED:    { cls: 'bg-green-100 text-green-700', label: 'Resolved' },
  CLOSED:      { cls: 'bg-gray-100 text-gray-500',   label: 'Closed' },
}

export default function BookVetClient({
  vets,
  animals,
  consultations,
}: {
  vets: Vet[]
  animals: Animal[]
  consultations: Consultation[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [selectedVet, setSelectedVet] = useState<Vet | null>(null)
  const [animalId, setAnimalId] = useState('')
  const [question, setQuestion] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [tab, setTab] = useState<'browse' | 'history'>('browse')

  function openModal(vet: Vet) {
    setSelectedVet(vet)
    setAnimalId('')
    setQuestion('')
    setIsEmergency(false)
    setPhotos([])
    setError(null)
    setDone(false)
  }

  function closeModal() {
    setSelectedVet(null)
    setDone(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Upload failed')
          return data.url as string
        }),
      )
      setPhotos((prev) => [...prev, ...urls])
    } catch {
      setError('Photo upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSubmit() {
    if (!animalId) return setError('Please select an animal.')
    if (!question.trim()) return setError('Please describe the issue.')
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalId, question: question.trim(), photos, isEmergency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to book consultation')
      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {(['browse', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'browse' ? 'Browse Vets' : `Consultations${consultations.length ? ` (${consultations.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── BROWSE TAB ── */}
      {tab === 'browse' && (
        <>
          {vets.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center space-y-3 text-gray-400">
              <Stethoscope className="h-16 w-16 text-gray-200" />
              <p className="text-lg font-semibold text-gray-700">No vets available right now</p>
              <p className="text-sm">Check back later or mark your consultation as an emergency to alert on-call vets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vets.map((vet) => (
                <div
                  key={vet.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col gap-4"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                      {vet.user.image ? (
                        <Image src={vet.user.image} alt={vet.user.name ?? 'Vet'} width={48} height={48} className="object-cover" unoptimized />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{vet.user.name ?? 'Dr. Unknown'}</p>
                      {vet.specialization && (
                        <p className="text-xs text-gray-400 truncate">{vet.specialization}</p>
                      )}
                    </div>
                    {vet.onCallAvailable && (
                      <span className="ml-auto shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        On-call
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 text-sm text-gray-500">
                    {vet.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                        {vet.city}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                      {vet.totalConsultations} consultation{vet.totalConsultations !== 1 ? 's' : ''}
                    </div>
                    {vet.rating !== null && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-gray-700">{vet.rating.toFixed(1)}</span>
                        <span className="text-gray-400">/ 5.0</span>
                      </div>
                    )}
                  </div>

                  {/* License */}
                  <p className="text-xs text-gray-300 font-mono truncate">Lic: {vet.licenseNo}</p>

                  <Button
                    onClick={() => openModal(vet)}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold mt-auto"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Book Consultation
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <>
          {consultations.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center space-y-3 text-gray-400">
              <MessageSquare className="h-16 w-16 text-gray-200" />
              <p className="text-lg font-semibold text-gray-700">No consultations yet</p>
              <p className="text-sm">Book a vet for any of your animals to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((c) => {
                const st = STATUS_STYLES[c.status] ?? STATUS_STYLES['OPEN']
                return (
                  <a
                    key={c.id}
                    href={`/vet/consultations/${c.id}`}
                    className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">
                          {c.animal?.name ?? c.animal?.species ?? 'Animal'}
                        </p>
                        <Badge className={st.cls}>{st.label}</Badge>
                        {c.isEmergency && (
                          <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Emergency
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{c.question}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {c.vet?.user.name ?? 'Awaiting vet'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {c.messages.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {c.messages.length} message{c.messages.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Booking Modal ── */}
      {selectedVet && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                {selectedVet.user.image ? (
                  <Image src={selectedVet.user.image} alt={selectedVet.user.name ?? 'Vet'} width={40} height={40} className="object-cover" unoptimized />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{selectedVet.user.name ?? 'Dr. Unknown'}</p>
                {selectedVet.specialization && (
                  <p className="text-xs text-gray-400">{selectedVet.specialization}</p>
                )}
              </div>
              {selectedVet.onCallAvailable && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  On-call
                </span>
              )}
              <button onClick={closeModal} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 ml-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {done ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <h3 className="text-xl font-bold text-gray-900">Consultation booked!</h3>
                  <p className="text-gray-500 text-sm">
                    The vet will review your request and respond shortly. You can track it under <strong>Consultations</strong>.
                  </p>
                  <div className="flex gap-3 w-full pt-2">
                    <Button variant="outline" onClick={closeModal} className="flex-1">Close</Button>
                    <Button onClick={() => { closeModal(); setTab('history') }} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                      View Consultations
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Animal */}
                  <div className="space-y-1.5">
                    <Label>Animal *</Label>
                    {animals.length === 0 ? (
                      <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                        No animals currently in treatment. Add a rescue case first.
                      </p>
                    ) : (
                      <Select value={animalId} onValueChange={setAnimalId}>
                        <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
                        <SelectContent>
                          {animals.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name ?? a.species}{a.breed ? ` (${a.breed})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Question */}
                  <div className="space-y-1.5">
                    <Label htmlFor="question">Describe the issue *</Label>
                    <Textarea
                      id="question"
                      rows={4}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Symptoms, duration, medications given, any concerns…"
                      className="resize-none"
                    />
                  </div>

                  {/* Photos */}
                  <div className="space-y-2">
                    <Label>Attach Photos (optional)</Label>
                    <div className="flex flex-wrap gap-3">
                      {photos.map((url) => (
                        <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                          <Image src={url} alt="photo" fill className="object-cover" unoptimized />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((u) => u !== url))}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-white" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 transition-colors text-gray-400 hover:text-primary"
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <>
                            <ImagePlus className="h-4 w-4" />
                            <span className="text-[9px] font-medium">Add</span>
                          </>
                        )}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                    </div>
                  </div>

                  {/* Emergency toggle */}
                  <button
                    type="button"
                    onClick={() => setIsEmergency((v) => !v)}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left ${
                      isEmergency
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/50'
                    }`}
                  >
                    <AlertTriangle className={`h-5 w-5 shrink-0 ${isEmergency ? 'text-red-500' : 'text-gray-300'}`} />
                    <div>
                      <p className="font-semibold text-sm">Mark as Emergency</p>
                      <p className="text-xs opacity-70 mt-0.5">Alerts all on-call vets immediately via push notification</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isEmergency ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                      {isEmergency && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!done && (
              <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 shrink-0">
                <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || uploading || animals.length === 0}
                  className={`flex-1 font-semibold text-white ${isEmergency ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Booking…</>
                  ) : isEmergency ? (
                    <><AlertTriangle className="h-4 w-4 mr-2" />Send Emergency Request</>
                  ) : (
                    <><Stethoscope className="h-4 w-4 mr-2" />Book Consultation</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
