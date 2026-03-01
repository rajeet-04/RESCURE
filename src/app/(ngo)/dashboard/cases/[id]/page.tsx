import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CaseStatusForm from './_components/case-status-form'
import SlaTimer from '@/components/cases/sla-timer'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

const urgencyColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let rescueCase = await prisma.rescueCase.findFirst({
    where: {
      OR: [
        { id: id },
        { reportId: id }
      ]
    },
    include: {
      report: true,
      ngo: {
        include: {
          fieldWorkers: { select: { id: true, user: { select: { name: true } } } },
        },
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, state: true, note: true, createdAt: true },
      },
    },
  })

  let report = rescueCase?.report
  let isPending = false

  if (!rescueCase) {
    const pendingReport = await prisma.incidentReport.findUnique({
      where: { id: id }
    })
    if (!pendingReport) notFound()
    report = pendingReport
    isPending = true
  }

  if (!report) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Incident Report</h1>
          <Badge className={urgencyColors[report.urgencyScore]}>{report.urgencyScore}</Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {rescueCase ? `Case #${rescueCase.id.slice(0, 8)} · ` : `Incident #${report.id.slice(0, 8)} · `}
          Created {new Date(rescueCase ? rescueCase.createdAt : report.createdAt).toLocaleDateString('en-IN')}
        </p>
        {!isPending && rescueCase && (
          <div className="mt-3">
            <SlaTimer
              caseId={rescueCase.id}
              deadline={rescueCase.slaDeadline?.toISOString() ?? null}
              urgency={report.urgencyScore}
              state={rescueCase.state}
            />
          </div>
        )}
        {isPending && (
          <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
            This incident is currently pending. You can accept it from your Dashboard queue to create a case and assign field workers.
          </div>
        )}
      </div>

      {/* Location */}
      <div className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Location</h2>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 text-orange-500" />
          {report.address ?? 'No address provided'}
        </div>
        <div className="rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-600">
          Lat: {report.lat} · Lng: {report.lng}
        </div>
        <p className="text-xs text-gray-400">Geohash: {report.geohash}</p>
      </div>

      {/* Animal Description */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Animal Description
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">{report.description ?? 'No description provided.'}</p>
      </div>

      {/* Image Gallery */}
      {report.photos.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Photos
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {report.photos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Photo ${i + 1}`}
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Status Update Form */}
      {!isPending && rescueCase && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Update Status
          </h2>
          <CaseStatusForm
            caseId={rescueCase.id}
            currentStatus={rescueCase.state}
            workers={rescueCase.ngo.fieldWorkers.map((w) => ({
              id: w.id,
              name: w.user.name ?? 'Unnamed',
            }))}
            assignedWorkerId={rescueCase.workerId ?? null}
          />
        </div>
      )}

      {/* Timeline */}
      {!isPending && rescueCase && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Activity Timeline
          </h2>
          {rescueCase.timeline.length === 0 ? (
            <p className="text-sm text-gray-400">No updates yet.</p>
          ) : (
            <ol className="relative ml-3 border-l border-orange-200 space-y-5">
              {rescueCase.timeline.map((entry) => (
                <li key={entry.id} className="ml-6">
                  <span className="absolute -left-2.5 h-5 w-5 rounded-full bg-orange-500 ring-4 ring-white" />
                  <p className="text-sm font-semibold text-gray-800">{entry.state.replace('_', ' ')}</p>
                  {entry.note && <p className="text-sm text-gray-600 mt-0.5">{entry.note}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(entry.createdAt).toLocaleString('en-IN')}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
