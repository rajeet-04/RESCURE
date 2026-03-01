'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

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
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setError(null)
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Upload failed')
          return data.url as string
        }),
      )
      setImages((prev) => [...prev, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
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
          images,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Failed to create product.')
        return
      }

      setSuccess(true)
      setForm(EMPTY)
      setImages([])
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image upload */}
      <div className="space-y-2">
        <Label>Product Images</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((url) => (
            <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
              <Image src={url} alt="product" fill className="object-cover" unoptimized />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-orange-400 hover:bg-orange-50 transition-colors text-gray-400 hover:text-orange-500"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Upload</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} aria-label="Upload product images" />
        </div>
        <p className="text-xs text-gray-400">PNG, JPG or WEBP. Multiple images allowed.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Royal Canin Dry Food"
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
            className="resize-none"
          />
        </div>

        <div className="space-y-1">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="priceRetail">Retail Price (₹) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <Input id="priceRetail" type="number" step="0.01" min="0" value={form.priceRetail}
              onChange={(e) => set('priceRetail', e.target.value)} placeholder="0.00" className="pl-7" />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="priceNGO">NGO Price (₹) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <Input id="priceNGO" type="number" step="0.01" min="0" value={form.priceNGO}
              onChange={(e) => set('priceNGO', e.target.value)} placeholder="0.00" className="pl-7" />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input id="stock" type="number" min="0" value={form.stock}
            onChange={(e) => set('stock', e.target.value)} placeholder="e.g. 100" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 rounded-lg bg-red-50 px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 font-medium rounded-lg bg-green-50 px-3 py-2">✅ Product added successfully!</p>}

      <Button type="submit" disabled={loading || uploading} className="bg-orange-600 hover:bg-orange-700 text-white">
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : 'Add Product'}
      </Button>
    </form>
  )
}

