'use client'

import { useState } from 'react'

interface VolunteerButtonProps {
  surgeId: string
}

export default function VolunteerButton({ surgeId }: VolunteerButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleVolunteer() {
    setStatus('loading')
    try {
      const res = await fetch('/api/surge/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surgeId }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="mt-4 rounded-lg bg-green-800 px-4 py-3 text-center text-green-200 font-semibold">
        ✅ Thank you for volunteering! An NGO will contact you shortly.
      </div>
    )
  }

  return (
    <button
      onClick={handleVolunteer}
      disabled={status === 'loading'}
      className="mt-4 w-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
    >
      {status === 'loading' ? 'Registering…' : "🙋 I'll Volunteer"}
    </button>
  )
}
