import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'

export async function GET() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
  if (!ngo) {
    return NextResponse.json({ orders: [] })
  }

  // Stub: recurring templates are orders with DELIVERED status
  const orders = await prisma.order.findMany({
    where: { ngoId: ngo.id, status: 'DELIVERED' },
    include: {
      items: { include: { product: { select: { name: true } } } },
      supplier: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ngo = await prisma.nGO.findUnique({ where: { userId: user.id } })
  if (!ngo) {
    return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
  }

  const allowedTiers: SubscriptionTier[] = [SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]
  if (!allowedTiers.includes(ngo.tier)) {
    return NextResponse.json(
      { error: 'Recurring orders require Pro or Enterprise subscription' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.productId || !body.quantity || !body.frequency) {
    return NextResponse.json({ error: 'Missing required fields: productId, quantity, frequency' }, { status: 400 })
  }

  const { productId, quantity, frequency } = body as {
    productId: string
    quantity: number
    frequency: 'weekly' | 'monthly'
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const qty = parseInt(String(quantity), 10)
  if (!qty || qty <= 0) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  }

  const order = await prisma.order.create({
    data: {
      ngoId: ngo.id,
      supplierId: product.supplierId,
      total: product.priceNGO * qty,
      isNGOPrice: true,
      address: `RECURRING:${frequency}`,
      items: {
        create: [{ productId, quantity: qty, unitPrice: product.priceNGO }],
      },
    },
    include: { items: { include: { product: { select: { name: true } } } } },
  })

  return NextResponse.json({ order }, { status: 201 })
}
