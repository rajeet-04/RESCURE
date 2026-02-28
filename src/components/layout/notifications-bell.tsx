'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationsBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unreadOnly=true')
      if (!res.ok) return
      const data = await res.json() as { notifications: Notification[]; unreadCount: number }
      setUnreadCount(data.unreadCount)
      setNotifications(data.notifications.slice(0, 5))
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    // Calling fetchUnread() directly in the effect body can trigger 
    // the react-hooks/set-state-in-effect warning if it syncs state 
    // at the beginning of its async execution.
    const runFetch = async () => {
      await fetchUnread();
    };
    runFetch();
  }, [fetchUnread])

  // Poll
  useEffect(() => {
    if (open) return

    const id = setInterval(fetchUnread, 30000)
    intervalRef.current = id
    return () => clearInterval(id)
  }, [open, fetchUnread])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleMarkAllRead() {
    try {
      await fetch('/api/notifications', { method: 'POST' })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silent fail
    }
  }

  function handleOpen() {
    setOpen((prev) => !prev)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80">
          <Card className="shadow-lg border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-semibold text-sm text-gray-800">Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-7">
                    Mark all read
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  No notifications yet
                </div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`flex gap-3 border-b px-4 py-3 last:border-0 ${!n.read ? 'bg-orange-50' : ''}`}
                    >
                      <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${!n.read ? 'bg-orange-500' : 'bg-gray-200'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {n.body.length > 60 ? n.body.slice(0, 60) + '…' : n.body}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t px-4 py-2">
                <Link href="/notifications" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-xs text-orange-600 hover:text-orange-700">
                    View all notifications →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
