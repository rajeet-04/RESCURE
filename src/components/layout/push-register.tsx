'use client'

import { useEffect } from 'react'

export default function PushRegister() {
  useEffect(() => {
    async function registerPush() {
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return

        let permission = Notification.permission
        if (permission === 'default') {
          permission = await Notification.requestPermission()
        }
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        const sub = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
      } catch (err) {
        console.error('[PushRegister]', err)
      }
    }

    registerPush()
  }, [])

  return null
}
