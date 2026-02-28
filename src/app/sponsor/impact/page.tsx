import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ImpactReportClient from './_components/impact-report-client'

export default async function SponsorImpactPage({
  searchParams,
}: {
  searchParams: { month?: string }
}) {
  const session = await auth()
  const user = session?.user as { id: string; name?: string } | undefined
  if (!user) redirect('/login')

  const monthParam = searchParams.month ?? ''
  const now = new Date()
  let year: number
  let month: number

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    year = y
    month = m - 1
  } else {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    year = prev.getFullYear()
    month = prev.getMonth()
  }

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
  const displayMonth = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthName = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })

  const sponsorships = await prisma.sponsorship.findMany({
    where: { sponsorId: user.id, active: true },
    include: {
      animal: {
        include: {
          expenses: { where: { date: { gte: monthStart, lte: monthEnd } } },
          healthRecords: {
            where: { date: { gte: monthStart, lte: monthEnd } },
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  })

  const animals = sponsorships.map((s) => {
    const a = s.animal
    const totalExpenses = a.expenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      id: a.id,
      name: a.name ?? 'Unnamed Animal',
      species: a.species,
      photo: a.photos[0] ?? null,
      planAmount: s.planAmount,
      expenses: a.expenses.map((e) => ({
        category: e.category,
        amount: e.amount,
        note: e.note,
        date: e.date.toISOString(),
      })),
      totalExpenses,
      healthRecords: a.healthRecords.map((h) => ({
        type: h.type,
        title: h.title,
        notes: h.notes,
        date: h.date.toISOString(),
      })),
    }
  })

  const totalContributed = sponsorships.reduce((sum, s) => sum + s.planAmount / 100, 0)
  const healthUpdates = animals.reduce((sum, a) => sum + a.healthRecords.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Your Impact — {monthName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prepared for {user.name ?? 'Sponsor'}
            </p>
          </div>
          <ImpactReportClient currentMonth={displayMonth} />
        </div>

        <Separator />

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Animals Sponsored
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {animals.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Contributed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                ₹{totalContributed.toFixed(0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Health Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {healthUpdates}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Per-Animal Sections */}
        {animals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg">No active sponsorships found for this month.</p>
              <p className="text-sm mt-1">Start sponsoring an animal to see your impact here.</p>
            </CardContent>
          </Card>
        ) : (
          animals.map((animal) => (
            <Card key={animal.id} className="overflow-hidden">
              <div className="flex gap-4 p-4">
                {/* Photo */}
                <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {animal.photo ? (
                    <Image src={animal.photo} alt={animal.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold">{animal.name}</h2>
                    <Badge variant="outline" className="capitalize text-xs">
                      {animal.species}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-green-700 bg-green-50">
                      ₹{(animal.planAmount / 100).toFixed(0)}/mo
                    </Badge>
                  </div>

                  {/* Expense breakdown */}
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Expenses This Month — ₹{animal.totalExpenses.toFixed(2)}
                    </p>
                    {animal.expenses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No expenses recorded.</p>
                    ) : (
                      <div className="space-y-1">
                        {animal.expenses.map((e, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="capitalize text-muted-foreground">{e.category}{e.note ? ` — ${e.note}` : ''}</span>
                            <span className="font-medium">₹{e.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Health milestones */}
                  {animal.healthRecords.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Health Milestones
                      </p>
                      <div className="space-y-1">
                        {animal.healthRecords.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Badge variant="outline" className="text-xs shrink-0">{h.type}</Badge>
                            <span>{h.title}{h.notes ? ` — ${h.notes}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}

        {/* Print footer */}
        <div className="print-only hidden text-center text-xs text-gray-400 pt-8">
          <p>Generated by RESCURE · rescure.app · {new Date().toLocaleDateString()}</p>
          <p>Thank you for making a difference 🐾</p>
        </div>
      </div>
    </div>
  )
}
