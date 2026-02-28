import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NGOMarketplaceClient from './_components/ngo-marketplace-client'

export const metadata = { title: 'Wholesale Marketplace — RESCURE' }

export default async function NGOMarketplacePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER') redirect('/unauthorized')

  const ngo = await prisma.nGO.findUnique({ where: { userId } })
  if (!ngo) redirect('/onboarding')

  const products = await prisma.product.findMany({
    where: { active: true, stock: { gt: 0 }, supplier: { verified: true } },
    include: { supplier: { select: { name: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const serialised = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wholesale Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Exclusive NGO prices — no minimum order. Delivered to your shelter.
          </p>
        </div>
        <a
          href="/dashboard/orders"
          className="self-start sm:self-auto text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          View my orders →
        </a>
      </div>

      <NGOMarketplaceClient products={serialised} ngoId={ngo.id} />
    </div>
  )
}
