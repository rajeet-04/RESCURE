import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Only NGO admins can place orders' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.productId || !body.quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { productId, quantity, deliveryAddress } = body as {
    productId: string
    quantity: number
    deliveryAddress?: string
  }

  const qty = parseInt(String(quantity), 10)
  if (!qty || qty <= 0) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  }

  const [ngo, product] = await Promise.all([
    prisma.nGO.findUnique({ where: { userId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ])

  if (!ngo) {
    return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
  }
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const order = await prisma.order.create({
    data: {
      ngoId: ngo.id,
      supplierId: product.supplierId,
      total: product.priceNGO * qty,
      isNGOPrice: true,
      address: deliveryAddress ?? null,
      items: {
        create: [{ productId, quantity: qty, unitPrice: product.priceNGO }],
      },
    },
    include: { items: true },
  })

  return NextResponse.json({ order }, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ngo = await prisma.nGO.findUnique({ where: { userId } })
  if (!ngo) {
    return NextResponse.json({ orders: [] })
  }

  const orders = await prisma.order.findMany({
    where: { ngoId: ngo.id },
    include: {
      items: { include: { product: { select: { name: true } } } },
      supplier: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
