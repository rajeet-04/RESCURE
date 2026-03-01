import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import { Users, AlertCircle } from 'lucide-react'
import UserMenu from '@/components/layout/user-menu'
import CommunityStats from './_components/community-stats'
import CommunityTabs from './_components/community-tabs'

export const metadata: Metadata = {
  title: 'Community — RESCURE',
  description: 'See recent rescues, top contributors, and your earned badges.',
}

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const session = await auth()
  const user = session?.user as { id: string; name?: string | null; image?: string | null; role?: string } | undefined

  const sessionUser = user
    ? { id: user.id ?? null, name: user.name ?? null, image: user.image ?? null, role: user.role ?? null }
    : null

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
    <main className="min-h-screen bg-white">
      {/* ── Header (matches landing page) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image src="/logo.png" alt="RESCURE" width={40} height={40} className="rounded-full transition-transform group-hover:scale-105" />
            <span className="font-bold text-2xl text-gray-900 tracking-tight">rescure</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '/', label: 'HOME' },
              { href: '/community', label: 'COMMUNITY' },
              { href: '/adopt', label: 'ADOPT' },
              { href: '/marketplace', label: 'MARKETPLACE' },
              { href: '/api-docs', label: 'API & PRICING' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  l.href === '/community' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {sessionUser ? (
              <UserMenu user={sessionUser} />
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors">Login</Link>
                <Link href="/report" className="text-sm font-bold bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Report Animal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="pt-32 pb-16 px-6 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2.5 rounded-full border border-primary/20 mb-6 animate-fade-in">
            <Users className="h-4 w-4" />
            COMMUNITY
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 animate-fade-in">RESCURE Community</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
            Together we&apos;re making a difference for stray animals across India.
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 px-6 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <CommunityStats />
        </div>
      </section>

      {/* ── Tabs Content ── */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <CommunityTabs
            feedItems={serializedFeed}
            leaderboard={leaderboardData}
            isAuthenticated={!!user}
          />
        </div>
      </section>
    </main>
  )
}
