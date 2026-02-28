import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import OrderForm from './_components/order-form'

type Props = { params: Promise<{ id: string }> }

const CATEGORY_LABELS: Record<string, string> = {
  'food-dry': 'Dry Food',
  'food-wet': 'Wet Food',
  medicine: 'Medicine',
  accessory: 'Accessory',
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { supplier: { select: { name: true, city: true, verified: true } } },
  })

  if (!product || !product.active) notFound()

  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  const isNGO = role === 'NGO_ADMIN'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="h-72 relative rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-7xl">📦</span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <Badge className="bg-gray-100 text-gray-700 whitespace-nowrap">
              {CATEGORY_LABELS[product.category] ?? product.category}
            </Badge>
          </div>

          <p className="text-sm text-gray-500">
            Supplied by{' '}
            <span className="font-medium">{product.supplier.name}</span>
            {product.supplier.city ? `, ${product.supplier.city}` : ''}
            {product.supplier.verified && (
              <span className="ml-1 text-green-600">✅ Verified</span>
            )}
          </p>

          {product.description && (
            <p className="text-sm text-gray-600">{product.description}</p>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Retail price</span>
              <span className="font-medium">
                ₹{(product.priceRetail / 100).toFixed(2)} / {product.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 font-medium">NGO price</span>
              <span className="text-green-700 font-bold text-lg">
                ₹{(product.priceNGO / 100).toFixed(2)} / {product.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Unit</span>
              <span>{product.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stock</span>
              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500 font-medium'}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Order section */}
      {isNGO ? (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Place an Order</h2>
          <OrderForm
            productId={product.id}
            productName={product.name}
            ngoPrice={product.priceNGO}
            supplierId={product.supplierId}
            unit={product.unit}
          />
        </div>
      ) : (
        <div className="rounded-xl border bg-orange-50 p-6 text-center space-y-3">
          <p className="text-gray-700 font-medium">
            🏢 The marketplace is exclusively for registered NGOs at NGO prices.
          </p>
          <p className="text-sm text-gray-500">
            If you represent an NGO,{' '}
            <Link href="/login" className="text-orange-600 underline font-medium">
              sign in
            </Link>{' '}
            or{' '}
            <Link href="/ngo/onboarding" className="text-orange-600 underline font-medium">
              register your NGO
            </Link>{' '}
            to place orders.
          </p>
          <Button asChild variant="outline">
            <Link href="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
