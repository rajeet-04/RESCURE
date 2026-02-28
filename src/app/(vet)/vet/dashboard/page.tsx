import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import OnCallToggle from './_components/on-call-toggle'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
}

export default async function VetDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as { id: string; role: string; name?: string }).id
  const role = (session.user as { id: string; role: string; name?: string }).role

  if (role !== 'VETERINARIAN') redirect('/unauthorized')

  const vet = await prisma.vet.findUnique({ where: { userId } })
  if (!vet) redirect('/vet/onboarding')

  const consultations = await prisma.consultation.findMany({
    where: { vetId: vet.id },
    include: { animal: true, ngo: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const openCount = consultations.filter((c) => c.status === 'OPEN').length
  const inProgressCount = consultations.filter((c) => c.status === 'IN_PROGRESS').length
  const resolvedCount = consultations.filter((c) => c.status === 'RESOLVED').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {vet.name ?? (session.user as { name?: string }).name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {vet.specialization ?? 'Veterinarian'} · {vet.verified ? '✅ Verified' : 'Pending verification'}
          </p>
        </div>
        <OnCallToggle vetId={vet.id} initialOnCall={vet.onCallAvailable} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{vet.totalConsultations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Consultations */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Recent Consultations</h2>
        {consultations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No consultations yet. You&apos;ll be notified when an NGO requests your help.
            </CardContent>
          </Card>
        ) : (
          consultations.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {c.animal?.name ?? c.animal?.species ?? 'Animal'}
                      </span>
                      {c.ngo && (
                        <span className="text-xs text-muted-foreground">· {c.ngo.name}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{c.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.isEmergency && <Badge variant="destructive">Emergency</Badge>}
                    <Badge className={STATUS_COLORS[c.status] ?? ''} variant="outline">
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/vet/consultations/${c.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
