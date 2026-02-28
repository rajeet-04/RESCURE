'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

type ProductItem = {
  id: string
  name: string
  description: string | null
  category: string
  priceRetail: number
  priceNGO: number
  unit: string
  stock: number
  images: string[]
  supplier: { name: string; city: string | null }
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'food-dry': 'Dry Food',
  'food-wet': 'Wet Food',
  medicine: 'Medicine',
  accessory: 'Accessory',
}

const CATEGORY_COLORS: Record<string, string> = {
  'food-dry': 'bg-yellow-100 text-yellow-800',
  'food-wet': 'bg-blue-100 text-blue-800',
  medicine: 'bg-red-100 text-red-800',
  accessory: 'bg-purple-100 text-purple-800',
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'food-dry', label: 'Food — Dry' },
  { key: 'food-wet', label: 'Food — Wet' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'accessory', label: 'Accessory' },
]

export default function MarketplaceClient({ products }: { products: ProductItem[] }) {
  const [category, setCategory] = useState('all')
  const [added, setAdded] = useState<string | null>(null)

  const filtered = category === 'all' ? products : products.filter((p) => p.category === category)

  function handleAddToCart(id: string) {
    setAdded(id)
    setTimeout(() => setAdded(null), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <ShoppingCart className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
        </div>
        <p className="mt-1 text-gray-500">
          Quality supplies for animal rescue — NGOs get special pricing.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setCategory(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              category === t.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">No products in this category.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product) => {
          const catColor = CATEGORY_COLORS[product.category] ?? 'bg-gray-100 text-gray-600'
          const catLabel = CATEGORY_LABELS[product.category] ?? product.category

          return (
            <Card key={product.id} className="overflow-hidden flex flex-col hover:shadow-md transition-all">
              <div className="h-44 relative bg-gray-100 flex items-center justify-center overflow-hidden">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 leading-tight">{product.name}</h2>
                  <Badge className={`${catColor} whitespace-nowrap`}>{catLabel}</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  by {product.supplier.name}
                  {product.supplier.city ? `, ${product.supplier.city}` : ''}
                </p>
              </CardHeader>
              <CardContent className="pb-2 flex-1 text-sm text-gray-600 space-y-2">
                {product.description && (
                  <p className="line-clamp-2">{product.description}</p>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retail price</span>
                    <span>₹{(product.priceRetail / 100).toFixed(2)} / {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">NGO price</span>
                    <span className="text-green-700 font-bold">
                      ₹{(product.priceNGO / 100).toFixed(2)} / {product.unit}
                    </span>
                  </div>
                </div>
                <p className={`text-xs ${product.stock > 0 ? 'text-gray-400' : 'text-red-500 font-medium'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 text-sm">
                  <Link href={`/marketplace/${product.id}`}>Details</Link>
                </Button>
                <Button
                  className="flex-1 text-sm bg-primary hover:bg-primary/90 text-white active:scale-[0.98] transition-all"
                  disabled={product.stock === 0}
                  onClick={() => handleAddToCart(product.id)}
                >
                  {added === product.id ? '✅ Added' : 'Add to Cart'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
