import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import SponsorButton from './_components/sponsor-button'

export const metadata = { title: 'Sponsor an Animal — RESCURE' }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  IN_TREATMENT: { label: 'In Treatment', color: 'bg-orange-100 text-orange-800' },
  STABLE: { label: 'Stable', color: 'bg-blue-100 text-blue-800' },
  READY_FOR_ADOPTION: { label: 'Ready for Adoption', color: 'bg-green-100 text-green-800' },
  ADOPTED: { label: 'Adopted', color: 'bg-purple-100 text-purple-800' },
  RELEASED: { label: 'Released', color: 'bg-teal-100 text-teal-800' },
  DECEASED: { label: 'Deceased', color: 'bg-gray-100 text-gray-600' },
}

const PLANS = [
  { label: 'Basic', amount: 29900, description: 'Food only', emoji: '🍖' },
  { label: 'Care', amount: 59900, description: 'Food + Medicine', emoji: '💊' },
  { label: 'Full', amount: 149900, description: 'Food + Medicine + Vet visits', emoji: '🏥' },
]

type Props = { params: Promise<{ id: string }> }

export default async function AnimalSponsorPage({ params }: Props) {
  const { id } = await params

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      healthRecords: { orderBy: { date: 'desc' }, take: 5 },
      expenses: { select: { amount: true, category: true, date: true } },
      sponsorships: { where: { active: true }, select: { id: true } },
      case: { select: { ngo: { select: { name: true, city: true } } } },
    },
  })

  if (!animal) notFound()

  const qrDataUrl = await QRCode.toDataURL(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://rescure.app'}/adopt/${id}`
  )

  const totalExpenses = animal.expenses.reduce((s, e) => s + e.amount, 0)
  const sponsorCount = animal.sponsorships.length
  const cfg = STATUS_CONFIG[animal.status] ?? { label: animal.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="h-72 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
            {animal.photos[0] ? (
              <img
                src={animal.photos[0]}
                alt={animal.name ?? animal.species}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-7xl">🐾</span>
            )}
          </div>
          {animal.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {animal.photos.slice(1).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {animal.name ?? `Unnamed ${animal.species}`}
              </h1>
              <p className="text-gray-500 capitalize mt-0.5">{animal.species}</p>
            </div>
            <Badge className={cfg.color}>{cfg.label}</Badge>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            {animal.breed && <p><span className="font-medium">Breed:</span> {animal.breed}</p>}
            {animal.gender && <p><span className="font-medium">Gender:</span> {animal.gender}</p>}
            {animal.estimatedAge && <p><span className="font-medium">Age:</span> {animal.estimatedAge}</p>}
            <p>
              <span className="font-medium">Intake date:</span>{' '}
              {new Date(animal.intakeDate).toLocaleDateString('en-IN')}
            </p>
            {animal.case?.ngo && (
              <p>
                <span className="font-medium">Care by:</span>{' '}
                {animal.case.ngo.name}
                {animal.case.ngo.city ? `, ${animal.case.ngo.city}` : ''}
              </p>
            )}
          </div>

          <Separator />

          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-gray-500">Total expenses</p>
              <p className="text-xl font-bold text-orange-600">₹{totalExpenses.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Active sponsors</p>
              <p className="text-xl font-bold text-green-600">{sponsorCount}</p>
            </div>
          </div>

          {sponsorCount > 0 && (
            <p className="text-sm text-green-700 font-medium">
              ❤️ {sponsorCount} {sponsorCount === 1 ? 'person is' : 'people are'} sponsoring this animal
            </p>
          )}

          {/* QR Code */}
          <div className="flex items-center gap-3">
            <img src={qrDataUrl} alt="QR Code" className="h-16 w-16" />
            <p className="text-xs text-gray-400">Scan to share this animal&apos;s page</p>
          </div>
        </div>
      </div>

      {/* Health highlights */}
      {animal.healthRecords.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Health Updates</h2>
          <div className="space-y-3">
            {animal.healthRecords.slice(0, 3).map((r) => (
              <div key={r.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-800">{r.title}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(r.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <Badge variant="outline" className="mt-1 text-xs">{r.type}</Badge>
                {r.notes && <p className="mt-1 text-sm text-gray-500">{r.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Sponsorship Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose a Sponsorship Plan</h2>
        <p className="text-gray-500 mb-6">Monthly contribution — simulated payment (no real charge).</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.label}
              className="rounded-2xl border-2 border-gray-200 hover:border-orange-400 bg-white p-6 space-y-3 transition-colors"
            >
              <div className="text-3xl">{plan.emoji}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{plan.label}</h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                ₹{(plan.amount / 100).toFixed(0)}
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </p>
              <SponsorButton
                animalId={animal.id}
                planAmount={plan.amount}
                planLabel={plan.label}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
