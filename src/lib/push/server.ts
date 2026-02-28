import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon ?? '/icons/icon-192x192.png',
          badge: payload.badge ?? '/icons/badge-72x72.png',
          url: payload.url ?? '/',
          tag: payload.tag,
          data: payload.data,
        })
      )
    )
  )

  // Remove expired subscriptions
  const expired = subscriptions.filter((_, i) => {
    const result = results[i]
    return result.status === 'rejected' &&
      (result.reason as { statusCode?: number })?.statusCode === 410
  })

  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expired.map((s) => s.endpoint) } },
    })
  }

  return results
}

export async function sendPushToRole(
  role: string,
  payload: PushPayload,
  limit = 100
) {
  const users = await prisma.user.findMany({
    where: { role: role as never },
    select: { id: true },
    take: limit,
  })

  await Promise.all(users.map((u) => sendPushToUser(u.id, payload)))
}
