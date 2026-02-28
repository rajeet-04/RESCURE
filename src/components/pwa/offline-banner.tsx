'use client'

import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return !navigator.onLine
}

function getServerSnapshot() {
  return false
}

export default function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-foreground text-white text-center py-2.5 px-4 text-sm font-semibold no-print border-b border-gray-800 flex items-center justify-center gap-2 animate-slide-up">
      <WifiOff className="h-4 w-4" />
      <span>Offline mode — reports will sync when reconnected</span>
    </div>
  )
}
