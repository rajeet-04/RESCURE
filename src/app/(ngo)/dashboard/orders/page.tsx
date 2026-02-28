import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Orders — RESCURE' }

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default async function NGOOrdersPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN') redirect('/unauthorized')

  const ngo = await prisma.nGO.findUnique({ where: { userId } })
  if (!ngo) redirect('/ngo/onboarding')

  const orders = await prisma.order.findMany({
    where: { ngoId: ngo.id },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
      supplier: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">Orders placed from the marketplace.</p>
        </div>
        <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
          <Link href="/marketplace">+ Place New Order</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-3">
          <p className="text-lg">No orders yet.</p>
          <Button asChild variant="outline">
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{order.supplier.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.product.name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    ₹{(order.total / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
