import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OnboardingForm from './_components/onboarding-form'

export default async function WorkerOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ ngoId?: string }>
}) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined

  const { ngoId: defaultNgoId } = await searchParams

  if (!user) {
    const returnTo = defaultNgoId
      ? `/worker/onboarding?ngoId=${defaultNgoId}`
      : '/worker/onboarding'
    redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`)
  }

  const existing = await prisma.fieldWorker.findUnique({
    where: { userId: user.id },
  })
  if (existing) redirect('/worker/dashboard')

  const ngos = await prisma.nGO.findMany({
    where: { verified: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="px-4 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Worker!</h1>
      <p className="text-gray-500 mb-8">Select your NGO to get started.</p>
      <OnboardingForm ngos={ngos} defaultNgoId={defaultNgoId} />
    </div>
  )
}
