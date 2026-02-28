import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'My Sponsorships — RESCURE' }

export default async function SponsorDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as { id: string }).id

  const sponsorships = await prisma.sponsorship.findMany({
    where: { sponsorId: userId, active: true },
    include: {
      animal: {
        include: {
          healthRecords: { orderBy: { date: 'desc' }, take: 2 },
          expenses: { select: { amount: true } },
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  })

  const totalMonthly = sponsorships.reduce((s, sp) => s + sp.planAmount, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Sponsorships</h1>
        <p className="text-gray-500 mt-1">Animals you are supporting.</p>
      </div>

      {sponsorships.length === 0 ? (
        <div className="flex flex-col items-center py-16 space-y-4 text-gray-400">
          <span className="text-6xl">🐾</span>
          <p className="text-lg font-medium">You have no active sponsorships yet.</p>
          <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
            <Link href="/adopt">Browse Animals</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Animals Sponsored</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{sponsorships.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Monthly Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">₹{(totalMonthly / 100).toFixed(0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sponsorship list */}
          <div className="space-y-4">
            {sponsorships.map((sp) => {
              const animal = sp.animal
              const totalExpenses = animal.expenses.reduce((s, e) => s + e.amount, 0)
              const latestRecord = animal.healthRecords[0]

              return (
                <Card key={sp.id} className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="h-24 w-24 relative flex-shrink-0 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                      {animal.photos[0] ? (
                        <Image
                          src={animal.photos[0]}
                          alt={animal.name ?? animal.species}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-3xl">🐾</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">
                          {animal.name ?? `Unnamed ${animal.species}`}
                        </h2>
                        <Badge variant="outline" className="text-xs capitalize">
                          {animal.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{animal.species}</p>
                      <div className="flex gap-4 text-xs text-gray-600 mt-1">
                        <span>
                          💰 ₹{(sp.planAmount / 100).toFixed(0)}/mo
                        </span>
                        <span>
                          🏥 Total expenses: ₹{totalExpenses.toFixed(2)}
                        </span>
                      </div>
                      {latestRecord && (
                        <p className="text-xs text-gray-500 mt-1">
                          Latest update: <span className="font-medium">{latestRecord.title}</span>{' '}
                          ({new Date(latestRecord.date).toLocaleDateString('en-IN')})
                        </p>
                      )}
                      <div className="pt-1">
                        <Link
                          href={`/adopt/${animal.id}`}
                          className="text-xs font-medium text-orange-600 hover:underline"
                        >
                          View Animal →
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
