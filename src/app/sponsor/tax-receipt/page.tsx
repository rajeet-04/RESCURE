import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function getPlanLabel(planAmount: number): string {
  const rupees = planAmount / 100
  if (rupees <= 299) return 'Basic (₹299/mo)'
  if (rupees <= 599) return 'Standard (₹599/mo)'
  return 'Premium (₹1499/mo)'
}

function monthsBetween(start: Date, end: Date): number {
  return (
    Math.max(1,
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) + 1
    )
  )
}

export default async function TaxReceiptPage({
  searchParams,
}: {
  searchParams: { year?: string }
}) {
  const session = await auth()
  const user = session?.user as { id: string; name?: string; email?: string } | undefined
  if (!user) redirect('/login')

  const year = searchParams.year ? parseInt(searchParams.year, 10) : new Date().getFullYear()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59)
  const now = new Date()

  const sponsorships = await prisma.sponsorship.findMany({
    where: {
      sponsorId: user.id,
      startedAt: { lte: yearEnd },
      OR: [
        { cancelledAt: null },
        { cancelledAt: { gte: yearStart } },
      ],
    },
    include: {
      animal: { select: { name: true, species: true } },
    },
    orderBy: { startedAt: 'asc' },
  })

  const receipts = sponsorships.map((s, idx) => {
    const effectiveStart = s.startedAt < yearStart ? yearStart : s.startedAt
    const effectiveEnd =
      s.cancelledAt && s.cancelledAt < yearEnd ? s.cancelledAt : (yearEnd < now ? yearEnd : now)
    const months = monthsBetween(effectiveStart, effectiveEnd)
    const amountPerMonth = s.planAmount / 100
    const totalAmount = months * amountPerMonth

    return {
      receiptNo: `RESCURE-${year}-${String(idx + 1).padStart(4, '0')}`,
      animalName: s.animal.name ?? 'Unnamed Animal',
      animalSpecies: s.animal.species,
      plan: getPlanLabel(s.planAmount),
      planAmount: amountPerMonth,
      monthsActive: months,
      totalAmount,
    }
  })

  const grandTotal = receipts.reduce((sum, r) => sum + r.totalAmount, 0)
  const receiptDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Print/Download Button */}
        <div className="flex justify-end gap-3 no-print">
          <button
            onClick={undefined}
            className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
            id="print-btn"
          >
            🖨️ Print / Download
          </button>
        </div>

        {/* Certificate */}
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50 border-b border-orange-200 text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">🐾</span>
              <div>
                <CardTitle className="text-2xl font-bold text-orange-800">RESCURE Foundation</CardTitle>
                <p className="text-sm text-orange-600">80G Tax Exemption Certificate</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Reg. No: RESCURE/NGO/2024 · 80G Cert: 80G/2024/RESCURE · PAN: ABCDE1234F
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Receipt Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Donor Name</p>
                <p className="font-semibold mt-0.5">{user.name ?? 'Valued Donor'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Donor Email</p>
                <p className="font-semibold mt-0.5">{user.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Financial Year</p>
                <p className="font-semibold mt-0.5">FY {year}–{(year + 1).toString().slice(-2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Issue Date</p>
                <p className="font-semibold mt-0.5">{receiptDate}</p>
              </div>
            </div>

            <Separator />

            {/* Table */}
            {receipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sponsorships found for {year}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="text-left py-2">Receipt No</th>
                      <th className="text-left py-2">Animal</th>
                      <th className="text-left py-2">Plan</th>
                      <th className="text-right py-2">Months</th>
                      <th className="text-right py-2">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => (
                      <tr key={r.receiptNo} className="border-b">
                        <td className="py-2 text-xs text-muted-foreground">{r.receiptNo}</td>
                        <td className="py-2 font-medium">
                          {r.animalName}
                          <span className="text-xs text-muted-foreground ml-1 capitalize">({r.animalSpecies})</span>
                        </td>
                        <td className="py-2 text-xs">{r.plan}</td>
                        <td className="py-2 text-right">{r.monthsActive}</td>
                        <td className="py-2 text-right font-medium">₹{r.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2">
                      <td colSpan={4} className="py-3 font-bold text-sm">Total Donation</td>
                      <td className="py-3 text-right font-bold text-lg text-green-700">
                        ₹{grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <Separator />

            {/* Declaration */}
            <div className="bg-orange-50 rounded-lg p-4 text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">Declaration</p>
              <p>
                We hereby certify that the donation stated above has been received from the above-named
                donor towards animal rescue and welfare activities. This donation qualifies for 50% tax
                deduction under Section 80G of the Income Tax Act, 1961.
              </p>
              <p className="mt-2 font-medium text-orange-700">
                ℹ️ This is an electronically generated receipt. No signature required.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print button client script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById('print-btn').addEventListener('click', function() { window.print(); });`,
        }}
      />
    </div>
  )
}
