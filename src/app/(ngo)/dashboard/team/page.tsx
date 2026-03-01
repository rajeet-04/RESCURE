import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TeamClient from './_components/team-client'

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
      <TeamClient
        workers={workers}
        ngo={{ id: ngo.id, name: ngo.name }}
      />
    </div>
  )
}
