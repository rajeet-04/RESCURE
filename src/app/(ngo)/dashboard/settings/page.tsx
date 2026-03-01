import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NGOSettingsForm from './_components/ngo-settings-form'

export const metadata = { title: 'Settings — RESCURE' }

export default async function NGOSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN') redirect('/unauthorized')

  const ngo = await prisma.nGO.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      city: true,
      state: true,
      registrationNo: true,
      verified: true,
      tier: true,
    },
  })
  if (!ngo) redirect('/ngo/onboarding')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your organisation profile.</p>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-3 text-sm">
        <span className={`rounded-full px-3 py-1 font-medium ${ngo.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {ngo.verified ? '✅ Verified NGO' : '⏳ Pending Verification'}
        </span>
        <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 font-medium">
          {ngo.tier} plan
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organisation Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <NGOSettingsForm ngo={ngo} />
        </CardContent>
      </Card>
    </div>
  )
}
