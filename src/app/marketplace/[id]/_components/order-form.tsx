'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  productId: string
  productName: string
  ngoPrice: number
  supplierId: string
  unit: string
}

export default function OrderForm({ productId, productName, ngoPrice, supplierId, unit }: Props) {
  const [quantity, setQuantity] = useState('1')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const qty = parseInt(quantity, 10) || 0
  const total = qty * ngoPrice

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (qty <= 0) {
      setError('Quantity must be at least 1.')
      return
    }
    if (!address.trim()) {
      setError('Delivery address is required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: qty, deliveryAddress: address, supplierId }),
      })

      if (res.status === 401) {
        setError('Please log in as an NGO to place orders.')
        return
      }
      if (res.status === 403) {
        setError('Only NGO accounts can place orders.')
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Failed to place order.')
        return
      }

      setOrderId((data as { order?: { id: string } }).order?.id ?? 'unknown')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orderId) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 space-y-2">
        <p className="text-green-800 font-semibold text-lg">✅ Order placed! Awaiting confirmation.</p>
        <p className="text-sm text-green-700">
          Order ID: <span className="font-mono font-medium">{orderId}</span>
        </p>
        <p className="text-xs text-green-600">The supplier will confirm your order shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-1">
        <Label htmlFor="quantity">
          Quantity ({unit})
        </Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="address">Delivery Address</Label>
        <Textarea
          id="address"
          placeholder="Full delivery address including pincode…"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="rounded-lg bg-gray-50 border p-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>{productName} × {qty || 0} {unit}</span>
          <span>₹{(ngoPrice / 100).toFixed(2)} each</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 mt-1 pt-1 border-t">
          <span>Total</span>
          <span className="text-orange-600">₹{(total / 100).toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
      >
        {loading ? 'Placing order…' : 'Place Order'}
      </Button>
    </form>
  )
}
