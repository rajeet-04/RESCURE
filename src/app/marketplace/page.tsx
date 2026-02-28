import { prisma } from '@/lib/prisma'
import MarketplaceClient from './_components/marketplace-client'

export const metadata = { title: 'Marketplace — RESCURE' }

export default async function MarketplacePage() {
  const products = await prisma.product.findMany({
    where: { active: true, supplier: { verified: true } },
    include: { supplier: { select: { name: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const serialised = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient-soft opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-white/90 to-green-50/30"></div>
      <div className="relative">
        <MarketplaceClient products={serialised} />
      </div>
    </div>
  )
}
