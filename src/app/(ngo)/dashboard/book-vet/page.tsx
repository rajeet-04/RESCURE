import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BookVetClient from './_components/book-vet-client'

export const metadata = { title: 'Book a Vet — RESCURE' }

export default async function BookVetPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER') redirect('/unauthorized')

  const ngo = await prisma.nGO.findUnique({ where: { userId } })
  if (!ngo) redirect('/onboarding')

  const [vets, animals, consultations] = await Promise.all([
    prisma.vet.findMany({
      where: { verified: true, available: true },
      select: {
        id: true,
        licenseNo: true,
        specialization: true,
        city: true,
        rating: true,
        totalConsultations: true,
        onCallAvailable: true,
        user: { select: { name: true, image: true } },
      },
      orderBy: [{ onCallAvailable: 'desc' }, { rating: 'desc' }],
    }),
    prisma.animal.findMany({
      where: { case: { ngoId: ngo.id }, status: { in: ['IN_TREATMENT', 'STABLE'] } },
      select: { id: true, name: true, species: true, breed: true },
      orderBy: { intakeDate: 'desc' },
    }),
    prisma.consultation.findMany({
      where: { ngoId: ngo.id },
      include: {
        animal: { select: { name: true, species: true } },
        vet: {
          select: {
            user: { select: { name: true } },
            specialization: true,
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const serialised = {
    vets,
    animals,
    consultations: consultations.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: c.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    })),
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Vet</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Browse verified veterinarians and request consultations for animals in your care.
        </p>
      </div>
      <BookVetClient {...serialised} />
    </div>
  )
}
