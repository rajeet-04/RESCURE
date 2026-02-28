import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SurgeActivateForm from './_components/surge-form'

export default async function AdminSurgePage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    redirect('/unauthorized')
  }

  const recentSurges = await prisma.surgeEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">🚨 Surge Control Panel</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Activation Form */}
        <SurgeActivateForm />

        {/* Recent Surges */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Surge Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSurges.length === 0 ? (
              <p className="text-sm text-gray-400">No surge events activated yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSurges.map((surge) => (
                    <div key={surge.id} className="rounded-lg border p-3">
                      <p className="font-semibold text-sm text-red-600">{surge.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{surge.reason ?? ''}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Radius: {surge.radiusKm} km ·{' '}
                        {new Date(surge.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
