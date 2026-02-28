'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    function handleOffline() { setIsOffline(true) }
    function handleOnline() { setIsOffline(false) }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-foreground text-white text-center py-2.5 px-4 text-sm font-semibold no-print border-b border-gray-800 flex items-center justify-center gap-2 animate-slide-up">
      <WifiOff className="h-4 w-4" />
      <span>Offline mode — reports will sync when reconnected</span>
    </div>
  )
}
