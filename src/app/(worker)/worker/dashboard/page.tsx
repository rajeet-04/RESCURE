import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, AlertCircle } from 'lucide-react'

type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

const urgencyColors: Record<UrgencyLevel, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
}

const urgencyOrder: UrgencyLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default async function WorkerDashboardPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string; name?: string } | undefined
  if (!user) redirect('/login')

  const fieldWorker = await prisma.fieldWorker.findUnique({
    where: { userId: user.id },
  })

  if (!fieldWorker) {
    redirect('/worker/onboarding')
  }

  const cases = await prisma.rescueCase.findMany({
    where: {
      workerId: fieldWorker.id,
      state: { notIn: ['RELEASED', 'CLOSED'] },
    },
    include: {
      report: {
        select: {
          lat: true,
          lng: true,
          photos: true,
          urgencyScore: true,
          description: true,
          address: true,
        },
      },
      animal: {
        select: { id: true, name: true, species: true },
      },
    },
  })

  const sorted = [...cases].sort((a, b) => {
    const ai = urgencyOrder.indexOf(
      (a.report?.urgencyScore ?? 'LOW') as UrgencyLevel
    )
    const bi = urgencyOrder.indexOf(
      (b.report?.urgencyScore ?? 'LOW') as UrgencyLevel
    )
    return ai - bi
  })

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Cases</h1>
          <p className="text-sm text-gray-500">{cases.length} active</p>
        </div>
        <Badge
          className={
            fieldWorker.available
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-red-100 text-red-800 border-red-200'
          }
        >
          {fieldWorker.available ? 'Available' : 'On Duty'}
        </Badge>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No active cases</p>
          <p className="text-sm text-gray-400 mt-1">{"You're all caught up!"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const urgency = (c.report?.urgencyScore ?? 'LOW') as UrgencyLevel
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={urgencyColors[urgency]}>
                        {urgency}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {c.state}
                      </Badge>
                    </div>
                    {c.report?.address && (
                      <p className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {c.report.address}
                      </p>
                    )}
                    {c.report?.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {c.report.description}
                      </p>
                    )}
                    {c.animal && (
                      <p className="text-xs text-gray-400">
                        {c.animal.name ? `${c.animal.name} · ` : ''}
                        {c.animal.species}
                      </p>
                    )}
                  </div>
                  <Link href={`/worker/cases/${c.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-3 shrink-0"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
