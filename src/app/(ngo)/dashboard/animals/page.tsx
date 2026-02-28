import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STATUS_COLORS: Record<string, string> = {
  IN_TREATMENT: 'bg-orange-100 text-orange-700',
  STABLE: 'bg-green-100 text-green-700',
  READY_FOR_ADOPTION: 'bg-blue-100 text-blue-700',
  ADOPTED: 'bg-gray-100 text-gray-700',
  RELEASED: 'bg-gray-100 text-gray-700',
  DECEASED: 'bg-red-100 text-red-700',
}

type AnimalCardData = { id: string; name?: string | null; species: string; status: string; photos: string[]; expenses?: { amount: number }[]; publicSlug?: string | null; intakeDate?: Date | string | null; _count?: { healthRecords: number; sponsorships: number } }
function AnimalCard({ animal }: { animal: AnimalCardData }) {
  const expenseTotal = animal.expenses?.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0) ?? 0
  const photo = animal.photos?.[0]

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 relative">
        {photo ? (
          <img src={photo} alt={animal.name ?? animal.species} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            🐾
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{animal.name ?? 'Unnamed'}</CardTitle>
          <Badge className={STATUS_COLORS[animal.status] ?? ''} variant="outline">
            {animal.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{animal.species}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm text-muted-foreground">
          <span>Health records: {animal._count?.healthRecords ?? 0}</span>
          <span className="mx-2">·</span>
          <span>Total expenses: ₹{expenseTotal.toFixed(2)}</span>
        </div>
        {animal.intakeDate && (
          <p className="text-xs text-muted-foreground">
            Intake: {new Date(animal.intakeDate).toLocaleDateString()}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" variant="default" className="flex-1">
            <Link href={`/dashboard/animals/${animal.id}`}>View</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/dashboard/animals/${animal.id}?tab=health`}>Add Health Record</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AnimalsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as { id: string }).id

  const ngo = await prisma.nGO.findUnique({ where: { userId } })
  if (!ngo) redirect('/onboarding')

  const rescueCases = await prisma.rescueCase.findMany({
    where: { ngoId: ngo.id },
    select: { id: true },
  })

  const caseIds = rescueCases.map((c) => c.id)

  const animals = await prisma.animal.findMany({
    where: { caseId: { in: caseIds } },
    select: {
      id: true,
      name: true,
      species: true,
      status: true,
      photos: true,
      intakeDate: true,
      qrCode: true,
      publicSlug: true,
      _count: { select: { healthRecords: true, sponsorships: true } },
      expenses: { select: { amount: true } },
    },
    orderBy: { intakeDate: 'desc' },
  })

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Animals</h1>
          <p className="text-muted-foreground">{animals.length} animal{animals.length !== 1 ? 's' : ''} in care</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/animals/new">+ Add Animal</Link>
        </Button>
      </div>

      {animals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No animals added yet. Start by adding an animal to a rescue case.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {animals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  )
}
