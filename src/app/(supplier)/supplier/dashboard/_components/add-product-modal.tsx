'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  X,
  Plus,
  ImagePlus,
  Trash2,
  Loader2,
  CheckCircle2,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export default function AddProductModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  function close() {
    setOpen(false)
    setForm(EMPTY)
    setImages([])
    setError(null)
    setSuccess(false)
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

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const priceRetailNum = parseFloat(form.priceRetail)
    const priceNGONum = parseFloat(form.priceNGO)
    const stockNum = parseInt(form.stock, 10)

    if (!form.name.trim()) return setError('Product name is required.')
    if (!form.category) return setError('Category is required.')
    if (isNaN(priceRetailNum) || priceRetailNum <= 0) return setError('Invalid retail price.')
    if (isNaN(priceNGONum) || priceNGONum <= 0) return setError('Invalid NGO price.')
    if (priceNGONum > priceRetailNum) return setError('NGO price cannot exceed retail price.')
    if (!form.unit.trim()) return setError('Unit is required.')
    if (isNaN(stockNum) || stockNum < 0) return setError('Invalid stock quantity.')

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
      if (!res.ok) return setError((data as { error?: string }).error ?? 'Failed to create product.')
      setSuccess(true)
      router.refresh()
      setTimeout(close, 1800)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={() => setOpen(true)}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Add Product
      </Button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={close}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Product</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details and upload images</p>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form body */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
            >
              {success ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <CheckCircle2 className="h-14 w-14 text-green-500" />
                  <p className="text-lg font-bold text-gray-900">Product added!</p>
                  <p className="text-sm text-gray-500">Your listing is now live on the marketplace.</p>
                </div>
              ) : (
                <>
                  {/* Image upload zone */}
                  <div className="space-y-2">
                    <Label>Product Images</Label>
                    <div className="flex flex-wrap gap-3">
                      {images.map((url) => (
                        <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                          <Image src={url} alt="product" fill className="object-cover" unoptimized />
                          <button
                            type="button"
                            onClick={() => removeImage(url)}
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
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="h-5 w-5" />
                            <span className="text-[10px] font-medium">Upload</span>
                          </>
                        )}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <p className="text-xs text-gray-400">PNG, JPG or WEBP. Multiple images allowed.</p>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="p-name">Product Name *</Label>
                    <Input
                      id="p-name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Royal Canin Dry Food 10kg"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="p-desc">Description</Label>
                    <Textarea
                      id="p-desc"
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="Ingredients, suitability, storage instructions…"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Category + Unit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Category *</Label>
                      <Select value={form.category} onValueChange={(v) => set('category', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="p-unit">Unit *</Label>
                      <Input
                        id="p-unit"
                        value={form.unit}
                        onChange={(e) => set('unit', e.target.value)}
                        placeholder="kg, pack, piece"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="p-retail">Retail Price (₹) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <Input
                          id="p-retail"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.priceRetail}
                          onChange={(e) => set('priceRetail', e.target.value)}
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="p-ngo">NGO Price (₹) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <Input
                          id="p-ngo"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.priceNGO}
                          onChange={(e) => set('priceNGO', e.target.value)}
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                      {form.priceNGO && form.priceRetail && (
                        <p className="text-xs text-green-600 font-medium">
                          {Math.max(0, Math.round(((parseFloat(form.priceRetail) - parseFloat(form.priceNGO)) / parseFloat(form.priceRetail)) * 100))}% discount for NGOs
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="space-y-1.5">
                    <Label htmlFor="p-stock">Stock Quantity *</Label>
                    <Input
                      id="p-stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => set('stock', e.target.value)}
                      placeholder="e.g. 200"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </>
              )}
            </form>

            {/* Footer */}
            {!success && (
              <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={close} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form=""
                  onClick={handleSubmit}
                  disabled={loading || uploading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
