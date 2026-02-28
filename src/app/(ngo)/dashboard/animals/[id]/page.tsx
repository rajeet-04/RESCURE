import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'qrcode'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AddHealthRecordForm from './_components/add-health-record-form'
import AddExpenseForm from './_components/add-expense-form'
import HandoffDialog from './_components/handoff-dialog'
import MilestoneForm from './_components/milestone-form'

const STATUS_COLORS: Record<string, string> = {
  IN_TREATMENT: 'bg-orange-100 text-orange-700',
  STABLE: 'bg-green-100 text-green-700',
  READY_FOR_ADOPTION: 'bg-blue-100 text-blue-700',
  ADOPTED: 'bg-gray-100 text-gray-700',
  RELEASED: 'bg-gray-100 text-gray-700',
  DECEASED: 'bg-red-100 text-red-700',
}

const HEALTH_TYPE_COLORS: Record<string, string> = {
  VACCINATION: 'bg-blue-100 text-blue-700',
  TREATMENT: 'bg-yellow-100 text-yellow-700',
  DIAGNOSIS: 'bg-purple-100 text-purple-700',
  SURGERY: 'bg-red-100 text-red-700',
  CHECKUP: 'bg-green-100 text-green-700',
  NOTE: 'bg-gray-100 text-gray-700',
}

export default async function AnimalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/login')

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      healthRecords: { orderBy: { date: 'desc' } },
      expenses: { orderBy: { date: 'desc' } },
      sponsorships: { where: { active: true } },
      consultations: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!animal) redirect('/dashboard/animals')

  const qrDataUrl = await QRCode.toDataURL(animal.qrCode)
  const expenseTotal = animal.expenses.reduce((sum, e) => sum + e.amount, 0)
  const defaultTab = resolvedSearchParams.tab ?? 'overview'

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Photo */}
        <div className="w-full sm:w-48 h-48 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {animal.photos[0] ? (
            <Image src={animal.photos[0]} alt={animal.name ?? ''} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🐾</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{animal.name ?? 'Unnamed Animal'}</h1>
            <Badge className={STATUS_COLORS[animal.status] ?? ''} variant="outline">
              {animal.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div><span className="font-medium text-foreground">Species:</span> {animal.species}</div>
            {animal.breed && <div><span className="font-medium text-foreground">Breed:</span> {animal.breed}</div>}
            {animal.gender && <div><span className="font-medium text-foreground">Gender:</span> {animal.gender}</div>}
            {animal.estimatedAge && <div><span className="font-medium text-foreground">Age:</span> {animal.estimatedAge}</div>}
            {animal.color && <div><span className="font-medium text-foreground">Color:</span> {animal.color}</div>}
            {animal.intakeDate && (
              <div><span className="font-medium text-foreground">Intake:</span> {new Date(animal.intakeDate).toLocaleDateString()}</div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap pt-1">
            <Link href={`/animals/${animal.publicSlug}`} className="text-sm text-blue-600 underline" target="_blank">
              Public profile ↗
            </Link>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <Image src={qrDataUrl} alt="QR Code" width={112} height={112} className="w-28 h-28" unoptimized />
          <p className="text-xs text-muted-foreground text-center">Scan to view public profile</p>
        </div>
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <HandoffDialog animalId={animal.id} />
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/consultations/new?animalId=${animal.id}`}>Request Vet Consultation</Link>
        </Button>
        <MilestoneForm animalId={animal.id} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Records</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Health Records</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{animal.healthRecords.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total Expenses</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">₹{expenseTotal.toFixed(2)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Active Sponsorships</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{animal.sponsorships.length}</p></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4 pt-4">
          <AddHealthRecordForm animalId={animal.id} />
          <Separator />
          <div className="space-y-3">
            {animal.healthRecords.length === 0 ? (
              <p className="text-muted-foreground text-sm">No health records yet.</p>
            ) : (
              animal.healthRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={HEALTH_TYPE_COLORS[record.type] ?? ''} variant="outline">
                        {record.type}
                      </Badge>
                      <span className="font-medium">{record.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 pt-4">
          <AddExpenseForm animalId={animal.id} />
          <Separator />
          <div className="space-y-2">
            {animal.expenses.length === 0 ? (
              <p className="text-muted-foreground text-sm">No expenses recorded.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2">Category</th>
                        <th className="text-left py-2">Note</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-right py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animal.expenses.map((expense) => (
                        <tr key={expense.id} className="border-b">
                          <td className="py-2 capitalize">{expense.category}</td>
                          <td className="py-2 text-muted-foreground">{expense.note ?? '-'}</td>
                          <td className="py-2 text-right">₹{expense.amount.toFixed(2)}</td>
                          <td className="py-2 text-right text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="py-2 font-medium">Total</td>
                        <td className="py-2 text-right font-bold">₹{expenseTotal.toFixed(2)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="space-y-3 pt-4">
          {animal.consultations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No consultations yet.</p>
          ) : (
            animal.consultations.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.status}</Badge>
                    {c.isEmergency && <Badge variant="destructive">Emergency</Badge>}
                    <span className="text-sm flex-1 truncate">{c.question}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
