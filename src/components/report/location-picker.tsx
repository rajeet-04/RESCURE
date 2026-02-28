'use client'

import { useState } from 'react'
import { encodeGeohash } from '@/lib/geo/geohash'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

interface LocationPickerProps {
  onLocation: (lat: number, lng: number, geohash: string) => void
}

export default function LocationPicker({ onLocation }: LocationPickerProps) {
  const [captured, setCaptured] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const geohash = encodeGeohash(lat, lng, 9)
        setCoords({ lat, lng })
        setCaptured(true)
        setLoading(false)
        onLocation(lat, lng, geohash)
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Please enter coordinates manually or enable GPS.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unavailable. Please try again.')
        } else {
          setError('Could not get location. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleGetLocation}
        disabled={loading}
        className="border-orange-300 text-orange-600 hover:bg-orange-50"
      >
        <MapPin className="mr-2 h-4 w-4" />
        {loading ? 'Getting location…' : captured ? 'Update Location' : 'Use My Location'}
      </Button>

      {captured && coords && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>
            Location captured — {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
