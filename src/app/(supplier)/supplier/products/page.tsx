import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AddProductForm from './_components/add-product-form'

export const metadata = { title: 'Products — Supplier Dashboard' }

const CATEGORY_LABELS: Record<string, string> = {
  'food-dry': 'Dry Food',
  'food-wet': 'Wet Food',
  medicine: 'Medicine',
  accessory: 'Accessory',
}

export default async function SupplierProductsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'SUPPLIER') redirect('/unauthorized')

  const supplier = await prisma.supplier.findUnique({ where: { userId } })
  if (!supplier) redirect('/supplier/onboarding')

  const products = await prisma.product.findMany({
    where: { supplierId: supplier.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1 text-sm">{products.length} product(s) listed.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/supplier/dashboard">← Dashboard</Link>
        </Button>
      </div>

      {/* Add product form */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Product</h2>
        <AddProductForm />
      </div>

      {/* Products list */}
      {products.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border bg-white p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                  <Badge className={p.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                    {p.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {CATEGORY_LABELS[p.category] ?? p.category}
                </Badge>
                {p.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>NGO: ₹{(p.priceNGO / 100).toFixed(2)}</span>
                  <span>Retail: ₹{(p.priceRetail / 100).toFixed(2)}</span>
                  <span>/{p.unit}</span>
                  <span className={p.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                    Stock: {p.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
