'use client'

import { useEffect, useState } from 'react'
import { Navigation } from 'lucide-react'

type GpsStatus = 'idle' | 'active' | 'error'

export default function GpsTracker() {
  const [status, setStatus] = useState<GpsStatus>(() =>
    typeof navigator !== 'undefined' && !navigator.geolocation ? 'error' : 'idle'
  )

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return
    }

    async function sendLocation() {
      if (typeof navigator === 'undefined') return
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch('/api/field-worker/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            })
            if (res.ok) setStatus('active')
            else setStatus('error')
          } catch {
            setStatus('error')
          }
        },
        () => setStatus('error')
      )
    }

    sendLocation()
    const intervalId = setInterval(sendLocation, 30_000)

    return () => clearInterval(intervalId)
  }, [])

  const colorClass =
    status === 'active'
      ? 'text-green-500'
      : status === 'error'
        ? 'text-red-400'
        : 'text-gray-400'

  return (
    <Navigation
      className={`h-4 w-4 ${colorClass}`}
      aria-label={`GPS ${status}`}
    />
  )
}
