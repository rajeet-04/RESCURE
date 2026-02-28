import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  IN_TREATMENT: 'bg-orange-100 text-orange-700',
  STABLE: 'bg-green-100 text-green-700',
  READY_FOR_ADOPTION: 'bg-blue-100 text-blue-700',
  ADOPTED: 'bg-gray-100 text-gray-700',
  RELEASED: 'bg-gray-100 text-gray-700',
  DECEASED: 'bg-red-100 text-red-700',
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const animal = await prisma.animal.findFirst({
    where: { publicSlug: params.slug },
    select: { name: true, species: true, photos: true, status: true },
  })

  if (!animal) return {}

  return {
    title: `${animal.name ?? animal.species} · RESCURE`,
    description: `Help ${animal.name ?? 'this ' + animal.species} — Status: ${animal.status.replace(/_/g, ' ')}`,
    openGraph: {
      title: `${animal.name ?? animal.species} needs your help`,
      description: `Status: ${animal.status.replace(/_/g, ' ')}`,
      images: animal.photos?.[0] ? [{ url: animal.photos[0] }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${animal.name ?? animal.species} · RESCURE`,
      description: `Help this animal — Status: ${animal.status.replace(/_/g, ' ')}`,
      images: animal.photos?.[0] ? [animal.photos[0]] : [],
    },
  }
}

export default async function PublicAnimalPage({ params }: { params: { slug: string } }) {
  const animal = await prisma.animal.findFirst({
    where: { publicSlug: params.slug },
    include: {
      healthRecords: { orderBy: { date: 'desc' }, take: 3 },
      expenses: { select: { amount: true } },
      sponsorships: { where: { active: true }, select: { id: true } },
      case: {
        select: {
          ngo: { select: { name: true } },
        },
      },
    },
  })

  if (!animal) notFound()

  const expenseTotal = animal.expenses.reduce((sum, e) => sum + e.amount, 0)
  const qrDataUrl = await QRCode.toDataURL(animal.qrCode)
  const ngoName = animal.case?.ngo?.name

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-2xl space-y-6">
        {/* Hero card */}
        <Card className="overflow-hidden">
          {animal.photos[0] && (
            <div className="aspect-video bg-gray-100">
              <img
                src={animal.photos[0]}
                alt={animal.name ?? animal.species}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{animal.name ?? 'Unnamed Animal'}</h1>
                <p className="text-muted-foreground capitalize">{animal.species}{animal.breed ? ` · ${animal.breed}` : ''}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={STATUS_COLORS[animal.status] ?? ''} variant="outline">
                  {animal.status.replace(/_/g, ' ')}
                </Badge>
                <img src={qrDataUrl} alt="QR" className="w-20 h-20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {animal.intakeDate && (
                <div>
                  <span className="font-medium">Intake date: </span>
                  <span className="text-muted-foreground">{new Date(animal.intakeDate).toLocaleDateString()}</span>
                </div>
              )}
              {ngoName && (
                <div>
                  <span className="font-medium">Rescued by: </span>
                  <span className="text-muted-foreground">{ngoName}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Total expenses: </span>
                <span className="text-muted-foreground">₹{expenseTotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Active sponsors: </span>
                <span className="text-muted-foreground">{animal.sponsorships.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health timeline */}
        {animal.healthRecords.length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h2 className="font-semibold">Recent Health Updates</h2>
              <Separator />
              {animal.healthRecords.map((record) => (
                <div key={record.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{record.type}</Badge>
                    <span className="text-sm font-medium">{record.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                  {record.notes && <p className="text-sm text-muted-foreground pl-1">{record.notes}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href={`/sponsor/${animal.id}`}>❤️ Sponsor This Animal</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
