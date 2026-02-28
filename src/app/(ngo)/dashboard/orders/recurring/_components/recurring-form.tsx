'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'

export default function RecurringOrderForm() {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId.trim()) {
      setError('Product ID is required')
      return
    }
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/orders/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: productId.trim(),
        quantity: parseInt(quantity, 10),
        frequency,
      }),
    })

    setSubmitting(false)
    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="font-semibold text-gray-800">Recurring order set up!</p>
        <p className="text-sm text-gray-500">Your {frequency} order has been created.</p>
        <Button
          variant="outline"
          onClick={() => { setSuccess(false); setProductId(''); setQuantity('1') }}
        >
          Set up another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="productId">Product ID</Label>
        <Input
          id="productId"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Enter product ID from marketplace"
        />
        <p className="text-xs text-gray-400">You can find the product ID in the marketplace listing URL.</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1"
        />
      </div>

      <div className="space-y-1">
        <Label>Frequency</Label>
        <Select value={frequency} onValueChange={(v) => setFrequency(v as 'weekly' | 'monthly')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        {submitting ? 'Setting up…' : 'Set Up Recurring Order'}
      </Button>
    </form>
  )
}
