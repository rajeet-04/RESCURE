import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    include: {
      animal: true,
      ngo: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const sessionUser = session.user as { id: string; role: string; name?: string }
  const openCount = consultations.filter((c) => c.status === 'OPEN').length
  const inProgressCount = consultations.filter((c) => c.status === 'IN_PROGRESS').length

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vet Dashboard</h1>
          <p className="text-muted-foreground">{sessionUser.name}</p>
        </div>
        <OnCallToggle vetId={vet.id} initialOnCall={vet.onCallAvailable} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Consultations</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{vet.totalConsultations}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Open</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{openCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">In Progress</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{inProgressCount}</p></CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Consultations</h2>
        {consultations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No consultations yet.</p>
        ) : (
          consultations.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{c.animal?.name ?? c.animal?.species ?? 'Animal'}</span>
                      {c.ngo && (
                        <span className="text-xs text-muted-foreground">· {c.ngo.name}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{c.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
