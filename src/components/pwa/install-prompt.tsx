'use client'

import { useEffect, useState } from 'react'
import { Heart, X } from 'lucide-react'

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 flex items-center justify-between gap-3 no-print animate-slide-up">
      <div className="flex items-center gap-3 min-w-0">
        <Heart className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-sm font-semibold text-foreground">
          Install RESCURE for quick access during emergencies
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="border-2 border-gray-200 text-muted-foreground px-3 py-2 rounded-lg hover:bg-secondary transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
