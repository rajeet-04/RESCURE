import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ConsultationChat from './_components/consultation-chat'

export default async function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: {
      animal: { select: { id: true, name: true, species: true, photos: true, status: true } },
      ngo: { select: { name: true, city: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!consultation) notFound()

  const userId = (session.user as { id: string }).id

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Consultation</h1>
        {consultation.isEmergency && <Badge variant="destructive">Emergency</Badge>}
        <Badge variant="outline">{consultation.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Animal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{consultation.animal?.name ?? consultation.animal?.species}</p>
            <p className="text-sm text-muted-foreground capitalize">{consultation.animal?.species}</p>
            <Badge variant="outline">{consultation.animal?.status?.replace(/_/g, ' ')}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">From NGO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{consultation.ngo?.name}</p>
            <p className="text-sm text-muted-foreground">{consultation.ngo?.city}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{consultation.question}</p>
          {consultation.photos.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {consultation.photos.map((url, i) => (
                <div key={i} className="relative w-24 h-24 border rounded overflow-hidden">
                  <Image
                    src={url}
                    alt="Attached photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConsultationChat
        consultationId={consultation.id}
        initialMessages={consultation.messages}
        currentUserId={userId}
      />
    </div>
  )
}
