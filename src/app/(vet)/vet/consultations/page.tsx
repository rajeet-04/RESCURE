import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
}

export default async function VetConsultationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as { id: string; role: string }).id
  const role = (session.user as { id: string; role: string }).role
  if (role !== 'VETERINARIAN') redirect('/unauthorized')

  const vet = await prisma.vet.findUnique({ where: { userId } })
  if (!vet) redirect('/vet/onboarding')

  const consultations = await prisma.consultation.findMany({
    where: { vetId: vet.id },
    include: {
      animal: { select: { name: true, species: true } },
      ngo: { select: { name: true, city: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
        <p className="text-sm text-gray-500 mt-1">{consultations.length} total</p>
      </div>

      {consultations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No consultations yet. You&apos;ll be notified when an NGO requests your help.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {c.animal?.name ?? c.animal?.species ?? 'Animal'}
                      </span>
                      {c.ngo && (
                        <span className="text-xs text-muted-foreground">
                          · {c.ngo.name}, {c.ngo.city}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.question}</p>
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
          ))}
        </div>
      )}
    </div>
  )
}
