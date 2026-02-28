import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import CaseActions from './_components/case-actions'
import { ReportStatus } from '@prisma/client'

type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

const urgencyColors: Record<UrgencyLevel, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
}

export default async function WorkerCaseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user) redirect('/login')

  const rescueCase = await prisma.rescueCase.findUnique({
    where: { id: params.id },
    include: {
      report: true,
      animal: {
        select: { id: true, name: true, species: true, photos: true },
      },
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!rescueCase) notFound()

  const urgency = (rescueCase.report?.urgencyScore ?? 'LOW') as UrgencyLevel

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/worker/dashboard" className="text-gray-500 hover:text-orange-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Case Detail</h1>
      </div>

      {/* Status + Urgency */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={urgencyColors[urgency]}>{urgency}</Badge>
        <Badge variant="outline">{rescueCase.state}</Badge>
      </div>

      {/* Report info */}
      {rescueCase.report && (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Incident Details</h2>
          {rescueCase.report.address && (
            <p className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              {rescueCase.report.address}
            </p>
          )}
          {rescueCase.report.description && (
            <p className="text-sm text-gray-600">{rescueCase.report.description}</p>
          )}
          <p className="text-xs text-gray-400">
            GPS: {rescueCase.report.lat.toFixed(5)}, {rescueCase.report.lng.toFixed(5)}
          </p>
          {rescueCase.report.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {rescueCase.report.photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={photo}
                  alt={`Incident photo ${i + 1}`}
                  className="h-24 w-24 rounded-lg object-cover shrink-0"
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Animal info */}
      {rescueCase.animal && (
        <Card className="p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Animal</h2>
          <p className="text-sm text-gray-600 capitalize">
            {rescueCase.animal.name
              ? `${rescueCase.animal.name} · `
              : ''}
            {rescueCase.animal.species}
          </p>
          {rescueCase.animal.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {rescueCase.animal.photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={photo}
                  alt={`Animal photo ${i + 1}`}
                  className="h-24 w-24 rounded-lg object-cover shrink-0"
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Timeline */}
      {rescueCase.timeline.length > 0 && (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">History</h2>
          <div className="space-y-3">
            {rescueCase.timeline.map((entry, i) => (
              <div key={entry.id}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {entry.state}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-gray-500">{entry.note}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick action */}
      <div className="pt-2">
        <CaseActions
          caseId={rescueCase.id}
          currentState={rescueCase.state as ReportStatus}
        />
      </div>
    </div>
  )
}
