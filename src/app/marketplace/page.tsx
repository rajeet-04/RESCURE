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

  return <MarketplaceClient products={serialised} />
}
