import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ConfirmOrderButton from './_components/confirm-order-button'

export const metadata = { title: 'Supplier Dashboard — RESCURE' }

const CATEGORY_LABELS: Record<string, string> = {
  'food-dry': 'Dry Food',
  'food-wet': 'Wet Food',
  medicine: 'Medicine',
  accessory: 'Accessory',
}

export default async function SupplierDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'SUPPLIER') redirect('/unauthorized')

  const supplier = await prisma.supplier.findUnique({ where: { userId } })
  if (!supplier) redirect('/supplier/onboarding')

  const [products, pendingOrders] = await Promise.all([
    prisma.product.findMany({
      where: { supplierId: supplier.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { supplierId: supplier.id, status: 'PENDING' },
      include: {
        items: { include: { product: true } },
        ngo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const activeProducts = products.filter((p) => p.active).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {supplier.city ?? 'No city set'} ·{' '}
          {supplier.verified ? '✅ Verified supplier' : '⏳ Pending verification'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{pendingOrders.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending orders queue */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending Orders</h2>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border bg-white p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-medium text-gray-800">From: {order.ngo.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </p>
                  <div className="text-sm text-gray-600">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.product.name} × {item.quantity} — ₹{(item.unitPrice / 100).toFixed(2)} each
                      </div>
                    ))}
                  </div>
                  <p className="font-semibold text-gray-900 pt-1">
                    Total: ₹{(order.total / 100).toFixed(2)}
                  </p>
                  {order.address && (
                    <p className="text-xs text-gray-400">📍 {order.address}</p>
                  )}
                </div>
                <ConfirmOrderButton orderId={order.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Products</h2>
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No products yet.{' '}
            <a href="/supplier/products" className="text-orange-600 underline">
              Add your first product →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{p.name}</h3>
                  <Badge className={p.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                    {p.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {CATEGORY_LABELS[p.category] ?? p.category}
                </Badge>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>NGO: ₹{(p.priceNGO / 100).toFixed(2)}</span>
                  <span>Retail: ₹{(p.priceRetail / 100).toFixed(2)}</span>
                  <span>Stock: {p.stock}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
