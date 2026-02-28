import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AutoRefresh from './_components/auto-refresh'
import ShareButton from './_components/share-button'
import { Badge } from '@/components/ui/badge'

const statusSteps = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const

const urgencyStyles: Record<string, { bg: string; text: string; label: string }> = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800', label: 'CRITICAL' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'HIGH' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'MEDIUM' },
  LOW: { bg: 'bg-green-100', text: 'text-green-800', label: 'LOW' },
}

const caseStateLabel: Record<string, string> = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESCUED: 'Animal Rescued',
  TREATED: 'Under Treatment',
  RELEASED: 'Released',
  ADOPTED: 'Adopted',
  CLOSED: 'Closed',
}

export default async function IncidentTrackingPage({
  params,
}: {
  params: { id: string }
}) {
  const incident = await prisma.incidentReport.findUnique({
    where: { id: params.id },
    include: {
      rescueCase: {
        select: {
          id: true,
          state: true,
          resolvedAt: true,
          ngo: { select: { name: true, city: true } },
          timeline: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, state: true, note: true, createdAt: true },
          },
        },
      },
    },
  })

  if (!incident) notFound()

  const urgency = urgencyStyles[incident.urgencyScore] ?? urgencyStyles.MEDIUM
  const currentStepIndex = statusSteps.indexOf(incident.status as (typeof statusSteps)[number])

  return (
    <main className="min-h-screen bg-orange-50">
      <AutoRefresh intervalMs={30000} />
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-orange-500 uppercase tracking-wide">RESCURE</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Incident Report</h1>
            <p className="mt-1 text-sm text-gray-500">
              Reported {new Date(incident.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <ShareButton
            title="Incident Report — RESCURE"
            url={`/report/${incident.id}`}
          />
        </div>

        {/* Urgency Badge */}
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${urgency.bg} ${urgency.text} font-semibold text-sm`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          Urgency: {urgency.label}
        </div>

        {/* Status Timeline */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Rescue Status
          </h2>
          <ol className="relative ml-3 border-l border-orange-200 space-y-6">
            {statusSteps.map((step, i) => {
              const done = i <= currentStepIndex
              const active = i === currentStepIndex
              return (
                <li key={step} className="ml-6">
                  <span
                    className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                      done ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  >
                    {done && (
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                  <p
                    className={`text-sm font-medium ${
                      active ? 'text-orange-600' : done ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.replace('_', ' ')}
                    {active && (
                      <span className="ml-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                        Current
                      </span>
                    )}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>

        {/* NGO & Case Info */}
        {incident.rescueCase?.ngo && (
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Assigned NGO
            </h2>
            <p className="font-medium text-gray-900">{incident.rescueCase.ngo.name}</p>
            {incident.rescueCase.ngo.city && (
              <p className="text-sm text-gray-500">📍 {incident.rescueCase.ngo.city}</p>
            )}
            {incident.rescueCase && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-gray-500">Case status:</span>
                <Badge className="bg-orange-100 text-orange-800">
                  {caseStateLabel[incident.rescueCase.state] ?? incident.rescueCase.state}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Case Timeline */}
        {incident.rescueCase?.timeline && incident.rescueCase.timeline.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Updates
            </h2>
            <ul className="space-y-4">
              {incident.rescueCase.timeline.map((entry) => (
                <li key={entry.id} className="border-l-2 border-orange-200 pl-4">
                  <p className="text-sm font-semibold text-gray-700">{entry.state.replace('_', ' ')}</p>
                  {entry.note && <p className="text-sm text-gray-600 mt-0.5">{entry.note}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(entry.createdAt).toLocaleString('en-IN')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Description */}
        {incident.description && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Description
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">{incident.description}</p>
            <p className="mt-3 text-xs text-gray-400">
              📍 {incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}
              {incident.address ? ` · ${incident.address}` : ''}
            </p>
          </div>
        )}

        {/* Image Gallery */}
        {incident.photos.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Photos
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {incident.photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Incident photo ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
