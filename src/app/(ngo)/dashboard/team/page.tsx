import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Team — RESCURE' }

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER') redirect('/unauthorized')

  const ngo = await prisma.nGO.findUnique({ where: { userId } })
  if (!ngo) redirect('/ngo/onboarding')

  const workers = await prisma.fieldWorker.findMany({
    where: { ngoId: ngo.id },
    include: {
      user: { select: { name: true, email: true, image: true } },
      _count: { select: { rescueCases: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {workers.length} field worker{workers.length !== 1 ? 's' : ''} in {ngo.name}
          </p>
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
          <Users className="h-10 w-10" />
          <p className="text-sm">No field workers yet.</p>
          <p className="text-xs text-gray-400">
            Workers will appear here once they sign up and join your NGO.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker.id} className="border shadow-sm">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  {worker.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={worker.user.image}
                      alt={worker.user.name ?? ''}
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                      {(worker.user.name ?? 'W').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {worker.user.name ?? 'Unnamed Worker'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{worker.user.email ?? ''}</p>
                  </div>
                  <Badge
                    className={`ml-auto shrink-0 text-xs ${
                      worker.available
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                    variant="outline"
                  >
                    {worker.available ? 'Available' : 'Busy'}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
                    <span>{worker._count.rescueCases} case{worker._count.rescueCases !== 1 ? 's' : ''}</span>
                  </div>
                  {worker.lastSeenAt ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>Active {formatDistanceToNow(new Date(worker.lastSeenAt), { addSuffix: true })}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Never active</span>
                    </div>
                  )}
                  {worker.lat && worker.lng ? (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      <span className="font-mono">
                        {worker.lat.toFixed(4)}, {worker.lng.toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <div className="col-span-2 flex items-center gap-1.5 text-gray-300">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Location unknown</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-300">
                  Joined {formatDistanceToNow(new Date(worker.createdAt), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
