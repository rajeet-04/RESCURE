import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CommunityStats from './_components/community-stats'
import CommunityTabs from './_components/community-tabs'

export const metadata: Metadata = {
  title: 'Community — RESCURE',
  description: 'See recent rescues, top contributors, and your earned badges.',
}

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined

  const [feedItems, leaderboardData] = await Promise.all([
    prisma.rescueCase.findMany({
      where: { state: { in: ['RESCUED', 'IN_CARE', 'RELEASED'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        state: true,
        createdAt: true,
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
        ngo: { select: { name: true, logo: true, city: true } },
        animal: { select: { name: true, species: true, photos: true, publicSlug: true } },
      },
    }),

    Promise.all([
      prisma.incidentReport.groupBy({
        by: ['citizenId'],
        where: { citizenId: { not: null } },
        _count: { citizenId: true },
        orderBy: { _count: { citizenId: 'desc' } },
        take: 10,
      }),
      prisma.rescueCase.groupBy({
        by: ['ngoId'],
        _count: { ngoId: true },
        where: { state: { in: ['RESCUED', 'RELEASED'] } },
        orderBy: { _count: { ngoId: 'desc' } },
        take: 10,
      }),
    ]).then(async ([reporterGroups, ngoGroups]) => {
      const userIds = reporterGroups
        .map((g) => g.citizenId)
        .filter(Boolean) as string[]
      const ngoIds = ngoGroups.map((g) => g.ngoId)

      const [users, ngos] = await Promise.all([
        prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, image: true },
        }),
        prisma.nGO.findMany({
          where: { id: { in: ngoIds } },
          select: { id: true, name: true, logo: true },
        }),
      ])

      const userMap = new Map(users.map((u) => [u.id, u]))
      const ngoMap = new Map(ngos.map((n) => [n.id, n]))

      return {
        topReporters: reporterGroups
          .filter((g) => g.citizenId !== null)
          .map((g) => {
            const u = userMap.get(g.citizenId as string)
            return {
              userId: g.citizenId as string,
              name: u?.name ?? null,
              image: u?.image ?? null,
              count: g._count.citizenId,
            }
          }),
        topNGOs: ngoGroups.map((g) => {
          const n = ngoMap.get(g.ngoId)
          return {
            ngoId: g.ngoId,
            name: n?.name ?? 'Unknown NGO',
            logo: n?.logo ?? null,
            count: g._count.ngoId,
          }
        }),
      }
    }),
  ])

  // Serialize dates for client components
  const serializedFeed = feedItems.map((item) => ({
    ...item,
    state: item.state as string,
    createdAt: item.createdAt.toISOString(),
    report: {
      ...item.report,
      urgencyScore: item.report.urgencyScore as string,
    },
  }))

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">🐾 RESCURE Community</h1>
          <p className="text-gray-500">
            Together we&apos;re making a difference for stray animals across India.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <CommunityStats />

        {/* Tabs */}
        <CommunityTabs
          feedItems={serializedFeed}
          leaderboard={leaderboardData}
          isAuthenticated={!!user}
        />
      </div>
    </main>
  )
}
