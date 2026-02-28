'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null)

  useEffect(() => {
    // Don't show if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if dismissed
    if (localStorage.getItem('pwa-install-dismissed') === '1') return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => void })
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      setShowBanner(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem('pwa-install-dismissed', '1')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-200 shadow-lg p-4 flex items-center justify-between gap-3 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0">🐾</span>
        <p className="text-sm font-medium text-gray-800 truncate">
          Install RESCURE app for the best experience
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-orange-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-orange-700"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-md text-xs hover:bg-gray-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
