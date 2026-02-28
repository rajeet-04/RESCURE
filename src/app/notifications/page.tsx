import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import MarkAllReadButton from './_components/mark-all-read-button'

export const dynamic = 'force-dynamic'

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function groupByDate(notifications: { createdAt: Date; id: string; type: string; title: string; body: string; read: boolean; readAt: Date | null; userId: string; payload: unknown }[]) {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()

  const groups: Record<string, typeof notifications> = { Today: [], Yesterday: [], Older: [] }
  for (const n of notifications) {
    const day = new Date(n.createdAt).toDateString()
    if (day === today) groups['Today'].push(n)
    else if (day === yesterday) groups['Yesterday'].push(n)
    else groups['Older'].push(n)
  }
  return groups
}

const typeIcons: Record<string, string> = {
  report_update: '📋',
  case_assigned: '🚑',
  milestone: '🏆',
  animal_update: '🐾',
  system: '🔔',
}

export default async function NotificationsPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string; name?: string } | undefined
  if (!user) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  const unreadCount = notifications.filter((n) => !n.read).length
  const groups = groupByDate(notifications)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border bg-gray-50 py-16 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([group, items]) => {
            if (items.length === 0) return null
            return (
              <div key={group}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{group}</h2>
                <div className="space-y-2">
                  {items.map((n) => (
                    <Card key={n.id} className={!n.read ? 'border-orange-200 bg-orange-50' : ''}>
                      <CardContent className="flex gap-3 p-4">
                        <span className="text-xl flex-shrink-0">{typeIcons[n.type] ?? '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!n.read && <Badge variant="default" className="bg-orange-500 text-[10px] px-1.5 py-0">New</Badge>}
                              <span className="text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                            </div>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">{n.body}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
