'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface NGOVerifyButtonProps {
  ngoId: string
  currentVerified: boolean
}

export default function NGOVerifyButton({ ngoId, currentVerified }: NGOVerifyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await fetch(`/api/admin/ngos/${ngoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentVerified }),
      })
      router.refresh()
    } catch (err) {
      console.error('Failed to update NGO verification', err)
    } finally {
      setLoading(false)
    }
  }

  if (currentVerified) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        {loading ? 'Revoking…' : 'Revoke'}
      </Button>
    )
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? 'Verifying…' : 'Verify'}
    </Button>
  )
}
