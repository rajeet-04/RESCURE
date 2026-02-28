'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CATEGORIES = [
  { value: 'food-dry', label: 'Dry Food' },
  { value: 'food-wet', label: 'Wet Food' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'accessory', label: 'Accessory' },
]

const EMPTY = {
  name: '',
  description: '',
  category: '',
  priceRetail: '',
  priceNGO: '',
  unit: '',
  stock: '',
}

export default function AddProductForm() {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const priceRetailNum = parseFloat(form.priceRetail)
    const priceNGONum = parseFloat(form.priceNGO)
    const stockNum = parseInt(form.stock, 10)

    if (!form.name.trim()) { setError('Product name is required.'); return }
    if (!form.category) { setError('Category is required.'); return }
    if (isNaN(priceRetailNum) || priceRetailNum <= 0) { setError('Invalid retail price.'); return }
    if (isNaN(priceNGONum) || priceNGONum <= 0) { setError('Invalid NGO price.'); return }
    if (!form.unit.trim()) { setError('Unit is required.'); return }
    if (isNaN(stockNum) || stockNum < 0) { setError('Invalid stock quantity.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          category: form.category,
          priceRetail: Math.round(priceRetailNum * 100),
          priceNGO: Math.round(priceNGONum * 100),
          unit: form.unit.trim(),
          stock: stockNum,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Failed to create product.')
        return
      }

      setSuccess(true)
      setForm(EMPTY)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Royal Canin Dry Food"
            required
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Product details, ingredients, suitable for…"
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="unit">Unit *</Label>
          <Input
            id="unit"
            value={form.unit}
            onChange={(e) => set('unit', e.target.value)}
            placeholder="e.g. kg, pack, piece"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="priceRetail">Retail Price (₹) *</Label>
          <Input
            id="priceRetail"
            type="number"
            step="0.01"
            min="0"
            value={form.priceRetail}
            onChange={(e) => set('priceRetail', e.target.value)}
            placeholder="e.g. 500.00"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="priceNGO">NGO Price (₹) *</Label>
          <Input
            id="priceNGO"
            type="number"
            step="0.01"
            min="0"
            value={form.priceNGO}
            onChange={(e) => set('priceNGO', e.target.value)}
            placeholder="e.g. 400.00"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
            placeholder="e.g. 100"
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600 font-medium">✅ Product added successfully!</p>}

      <Button
        type="submit"
        disabled={loading}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        {loading ? 'Adding product…' : 'Add Product'}
      </Button>
    </form>
  )
}
