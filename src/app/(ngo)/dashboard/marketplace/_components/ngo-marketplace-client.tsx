'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Tag,
  Search,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

type Product = {
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

type CartItem = { product: Product; qty: number }

const CATEGORY_LABELS: Record<string, string> = {
  'food-dry': 'Dry Food',
  'food-wet': 'Wet Food',
  medicine: 'Medicine',
  accessory: 'Accessory',
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'food-dry': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'food-wet': { bg: 'bg-sky-100', text: 'text-sky-700' },
  medicine: { bg: 'bg-red-100', text: 'text-red-700' },
  accessory: { bg: 'bg-violet-100', text: 'text-violet-700' },
}

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

function discountPct(retail: number, ngo: number) {
  if (!retail) return 0
  return Math.round(((retail - ngo) / retail) * 100)
}

export default function NGOMarketplaceClient({
  products,
  ngoId,
}: {
  products: Product[]
  ngoId: string
}) {
  const router = useRouter()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [address, setAddress] = useState('')
  const [placing, setPlacing] = useState(false)
  const [done, setDone] = useState(false)

  const filtered = useMemo(() => {
    let list = category === 'all' ? products : products.filter((p) => p.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.supplier.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [products, category, query])

  const categories = useMemo(() => {
    const all = Array.from(new Set(products.map((p) => p.category)))
    return all
  }, [products])

  const cartTotal = cart.reduce((sum, i) => sum + i.product.priceNGO * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { product, qty: 1 }]
    })
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId))
    } else {
      setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, qty } : i)))
    }
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  async function placeOrder() {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      // Place one order per item (API is per-product)
      const results = await Promise.all(
        cart.map((item) =>
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: item.product.id,
              quantity: item.qty,
              deliveryAddress: address || undefined,
            }),
          }),
        ),
      )
      const anyFailed = results.some((r) => !r.ok)
      if (anyFailed) throw new Error('Some items failed')
      setDone(true)
      setCart([])
    } catch {
      alert('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="relative">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 bg-white"
            placeholder="Search products or suppliers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              category === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                category === c
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40'
              }`}
            >
              {CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>

        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center px-1">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ── NGO price badge strip ── */}
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
        <Tag className="h-4 w-4 text-green-600 shrink-0" />
        <p className="text-sm text-green-800 font-medium">
          All prices shown are <span className="font-bold">exclusive NGO wholesale rates</span> — up to 40% off retail. Login as an NGO to access these prices.
        </p>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center text-gray-400 space-y-3">
          <Package className="h-16 w-16 text-gray-200" />
          <p className="text-lg font-semibold text-gray-700">No products found</p>
          <p className="text-sm">Try a different category or search term.</p>
        </div>
      )}

      {/* ── Product Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((product) => {
          const cat = CATEGORY_COLORS[product.category] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
          const catLabel = CATEGORY_LABELS[product.category] ?? product.category
          const discount = discountPct(product.priceRetail, product.priceNGO)
          const cartItem = cart.find((i) => i.product.id === product.id)

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-primary/20 transition-all"
            >
              {/* Image */}
              <div className="h-44 relative bg-gray-50 flex items-center justify-center overflow-hidden">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-200" />
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${cat.bg} ${cat.text}`}>
                    {catLabel}
                  </span>
                  {discount > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-100 text-green-700">
                      -{discount}%
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1 gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {product.supplier.name}
                    {product.supplier.city ? ` · ${product.supplier.city}` : ''}
                  </p>
                </div>

                {product.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                )}

                {/* Pricing */}
                <div className="mt-auto pt-2 border-t border-gray-50">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-primary">
                      {formatINR(product.priceNGO)}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">/{product.unit}</span>
                  </div>
                  {product.priceRetail > product.priceNGO && (
                    <p className="text-xs text-gray-400 line-through">{formatINR(product.priceRetail)} retail</p>
                  )}
                </div>

                {/* Stock */}
                <p className={`text-xs font-medium ${product.stock < 20 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {product.stock < 20 ? `⚠ Only ${product.stock} left` : `In stock: ${product.stock} ${product.unit}s`}
                </p>

                {/* Cart controls */}
                {cartItem ? (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setQty(product.id, cartItem.qty - 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex-1 text-center font-bold text-sm">{cartItem.qty}</span>
                    <button
                      onClick={() => setQty(product.id, cartItem.qty + 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      disabled={cartItem.qty >= product.stock}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full mt-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                    {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Your Cart
                {cartCount > 0 && (
                  <Badge className="bg-primary text-white text-xs ml-1">{cartCount}</Badge>
                )}
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {done ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <h3 className="text-xl font-bold text-gray-900">Order placed!</h3>
                  <p className="text-gray-500 text-sm">
                    Your order has been sent to the supplier. Track it under <strong>My Orders</strong>.
                  </p>
                  <Button
                    onClick={() => {
                      setCartOpen(false)
                      setDone(false)
                      router.push('/dashboard/orders')
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    View Orders
                  </Button>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 py-16">
                  <ShoppingCart className="h-14 w-14 text-gray-200" />
                  <p className="font-medium">Your cart is empty</p>
                  <p className="text-sm">Add products from the catalogue.</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.product.supplier.name}</p>
                        <p className="text-sm font-bold text-primary mt-0.5">
                          {formatINR(item.product.priceNGO * item.qty)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setQty(item.product.id, item.qty - 1)}
                          className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.product.id, item.qty + 1)}
                          className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          disabled={item.qty >= item.product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-7 h-7 rounded-md bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Delivery address */}
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Delivery Address (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shelter address for delivery…"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer: total + place order */}
            {!done && cart.length > 0 && (
              <div className="border-t px-6 py-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Total (NGO price)</span>
                  <span className="text-xl font-extrabold text-primary">{formatINR(cartTotal)}</span>
                </div>
                <Button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-base"
                >
                  {placing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  Orders are fulfilled at NGO wholesale rates. Payment on delivery.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
