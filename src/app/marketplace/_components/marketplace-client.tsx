'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Search, ShoppingCart, Check } from 'lucide-react'

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'food-dry': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'food-wet': { bg: 'bg-blue-100', text: 'text-blue-700' },
  medicine: { bg: 'bg-red-100', text: 'text-red-700' },
  accessory: { bg: 'bg-violet-100', text: 'text-violet-700' },
}

const FILTER_TABS = [
  { key: 'all', label: 'All Products' },
  { key: 'food-dry', label: 'Dry Food' },
  { key: 'food-wet', label: 'Wet Food' },
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
    <div className="space-y-10">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setCategory(t.key)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              category === t.key
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-5">
            <Search className="w-10 h-10 text-primary" />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">No products found</p>
          <p className="text-gray-500">Try a different category or check back later for new supplies.</p>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product, i) => {
          const cat = CATEGORY_COLORS[product.category] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
          const catLabel = CATEGORY_LABELS[product.category] ?? product.category
          const isAdded = added === product.id

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg hover:border-primary/20 transition-all animate-scale-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Image */}
              <div className="h-52 relative bg-gray-50 flex items-center justify-center overflow-hidden">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                ) : (
                  <Package className="w-14 h-14 text-gray-200" />
                )}
                {/* Category badge overlay */}
                <div className="absolute top-3 left-3">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${cat.bg} ${cat.text}`}>
                    {catLabel}
                  </span>
                </div>
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-full">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h2>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  by {product.supplier.name}{product.supplier.city ? ` · ${product.supplier.city}` : ''}
                </p>

                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>
                )}

                <div className="mt-auto space-y-3">
                  {/* Pricing */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 line-through">
                        ₹{(product.priceRetail / 100).toFixed(0)} / {product.unit}
                      </p>
                      <p className="text-lg font-extrabold text-primary">
                        ₹{(product.priceNGO / 100).toFixed(0)}
                        <span className="text-xs font-medium text-gray-500 ml-1">/ {product.unit} (NGO)</span>
                      </p>
                    </div>
                    {product.stock > 0 && (
                      <span className="text-xs text-gray-400">{product.stock} in stock</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/marketplace/${product.id}`}
                      className="flex-1 flex items-center justify-center py-3 rounded-full text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                      Details
                    </Link>
                    <button
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all active:scale-[0.98] ${
                        isAdded
                          ? 'bg-green-600 text-white'
                          : product.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isAdded ? (
                        <><Check className="h-4 w-4" /> Added</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4" /> Add to Cart</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
