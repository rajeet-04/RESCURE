import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RecurringOrderForm from './_components/recurring-form'

export const metadata = { title: 'Recurring Orders — RESCURE' }

export default async function RecurringOrdersPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN') redirect('/unauthorized')

  const ngo = await prisma.nGO.findUnique({
    where: { userId },
    select: { id: true, tier: true },
  })
  if (!ngo) redirect('/ngo/onboarding')

  const isPro = ngo.tier === 'PRO' || ngo.tier === 'ENTERPRISE'

  const orders = isPro
    ? await prisma.order.findMany({
        where: { ngoId: ngo.id, status: 'DELIVERED' },
        include: {
          items: { include: { product: { select: { name: true } } } },
          supplier: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">Automate your supply orders on a weekly or monthly schedule.</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-sm text-orange-600 hover:underline"
        >
          ← All Orders
        </Link>
      </div>

      {!isPro ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-2xl">🔒</p>
            <p className="font-semibold text-gray-800">Recurring orders require Pro or Enterprise</p>
            <p className="text-sm text-gray-600">
              Your current plan is <Badge variant="secondary">{ngo.tier}</Badge>.
              Upgrade to unlock automatic recurring orders.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Upgrade Plan
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Set Up Form */}
          <Card>
            <CardHeader>
              <CardTitle>Set Up Recurring Order</CardTitle>
            </CardHeader>
            <CardContent>
              <RecurringOrderForm />
            </CardContent>
          </Card>

          {/* Existing templates */}
          <Card>
            <CardHeader>
              <CardTitle>Recurring Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No recurring templates yet. Set one up to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-lg border p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{order.supplier.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {order.address?.replace('RECURRING:', '') ?? 'template'}
                        </Badge>
                      </div>
                      <div className="text-gray-500">
                        {order.items.map((item) => (
                          <span key={item.id}>
                            {item.product.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                      <div className="text-gray-400 text-xs">
                        ₹{(order.total / 100).toFixed(2)} per cycle
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
