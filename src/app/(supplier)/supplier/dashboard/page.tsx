import { redirect } from 'next/navigation'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  Package,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  ShoppingBag,
  IndianRupee,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ConfirmOrderButton from './_components/confirm-order-button'
import AddProductModal from './_components/add-product-modal'

export const metadata = { title: 'Supplier Dashboard — RESCURE' }

const CATEGORY_LABELS: Record<string, string> = {
  'food-dry': 'Dry Food',
  'food-wet': 'Wet Food',
  medicine: 'Medicine',
  accessory: 'Accessory',
}

const CATEGORY_COLORS: Record<string, string> = {
  'food-dry': 'bg-amber-100 text-amber-700',
  'food-wet': 'bg-sky-100 text-sky-700',
  medicine: 'bg-red-100 text-red-700',
  accessory: 'bg-violet-100 text-violet-700',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default async function SupplierDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'SUPPLIER') redirect('/unauthorized')

  const supplier = await prisma.supplier.findUnique({ where: { userId } })
  if (!supplier) redirect('/supplier/onboarding')

  const [products, pendingOrders, allOrders] = await Promise.all([
    prisma.product.findMany({
      where: { supplierId: supplier.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { supplierId: supplier.id, status: 'PENDING' },
      include: {
        items: { include: { product: { select: { name: true } } } },
        ngo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { supplierId: supplier.id },
      select: { total: true },
    }),
  ])

  const activeProducts = products.filter((p) => p.active).length
  const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Hero Header ── */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 px-8 py-7 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-orange-200">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight">{supplier.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-orange-100 text-sm">
            {supplier.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {supplier.city}
              </span>
            )}
            {supplier.verified ? (
              <span className="flex items-center gap-1 text-green-200 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified supplier
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-200 font-medium">
                <Clock className="h-3.5 w-3.5" /> Pending verification
              </span>
            )}
          </div>
        </div>
        <AddProductModal />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Products',
            value: products.length,
            icon: Package,
            color: 'text-orange-600 bg-orange-50',
            border: 'border-orange-100',
          },
          {
            label: 'Active Listings',
            value: activeProducts,
            icon: CheckCircle2,
            color: 'text-green-600 bg-green-50',
            border: 'border-green-100',
          },
          {
            label: 'Pending Orders',
            value: pendingOrders.length,
            icon: ShoppingBag,
            color: 'text-yellow-600 bg-yellow-50',
            border: 'border-yellow-100',
          },
          {
            label: 'Total Revenue',
            value: `₹${(totalRevenue / 100).toLocaleString('en-IN')}`,
            icon: IndianRupee,
            color: 'text-violet-600 bg-violet-50',
            border: 'border-violet-100',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl border ${stat.border} p-5 flex items-center gap-4 shadow-sm`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending Orders ── */}
      {pendingOrders.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pending Orders</h2>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-yellow-100 bg-white p-5 flex flex-col sm:flex-row sm:items-start gap-4 shadow-sm"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{order.ngo.name}</p>
                    <Badge className={STATUS_STYLES['PENDING']}>Pending</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <div className="text-sm text-gray-600 space-y-0.5 pt-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-1">
                        <span className="text-gray-400">·</span>
                        {item.product.name} × {item.quantity}
                        <span className="text-gray-400 ml-1">
                          @ ₹{(item.unitPrice / 100).toLocaleString('en-IN')} each
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="font-bold text-gray-900 pt-1">
                    Total: ₹{(order.total / 100).toLocaleString('en-IN')}
                  </p>
                  {order.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {order.address}
                    </p>
                  )}
                </div>
                <ConfirmOrderButton orderId={order.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Products Grid ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Your Products</h2>
          <span className="text-sm text-gray-400">{products.length} listing{products.length !== 1 ? 's' : ''}</span>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Package className="h-7 w-7 text-orange-400" />
            </div>
            <p className="font-semibold text-gray-700">No products yet</p>
            <p className="text-sm text-gray-400">Click &quot;Add Product&quot; above to create your first listing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => {
              const catClass = CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-600'
              const catLabel = CATEGORY_LABELS[p.category] ?? p.category
              const discount = p.priceRetail > p.priceNGO
                ? Math.round(((p.priceRetail - p.priceNGO) / p.priceRetail) * 100)
                : 0

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-orange-100 transition-all group"
                >
                  {/* Image */}
                  <div className="h-44 relative bg-gray-50 flex items-center justify-center overflow-hidden">
                    {p.images[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-200" />
                    )}
                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${catClass}`}>
                        {catLabel}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                          -{discount}% NGO
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {p.active ? 'Live' : 'Off'}
                      </span>
                    </div>
                    {p.images.length > 1 && (
                      <div className="absolute bottom-2 right-2.5 bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        +{p.images.length - 1} more
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">{p.name}</h3>
                      {p.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 pt-1 border-t border-gray-50">
                      <span className="text-lg font-extrabold text-orange-600">
                        ₹{(p.priceNGO / 100).toFixed(0)}
                      </span>
                      <span className="text-xs text-gray-400">NGO /{p.unit}</span>
                      {p.priceRetail > p.priceNGO && (
                        <span className="text-xs text-gray-400 line-through ml-auto">
                          ₹{(p.priceRetail / 100).toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${p.stock < 20 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {p.stock < 20 ? `⚠ Only ${p.stock} left` : `Stock: ${p.stock} ${p.unit}s`}
                      </span>
                      <TrendingUp className="h-3.5 w-3.5 text-gray-300" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
