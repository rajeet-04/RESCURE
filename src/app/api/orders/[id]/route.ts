import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'SUPPLIER') {
    return NextResponse.json({ error: 'Only suppliers can update order status' }, { status: 403 })
  }

  const { id: orderId } = await params

  const body = await req.json().catch(() => null)
  if (!body || !body.status) {
    return NextResponse.json({ error: 'Missing status' }, { status: 400 })
  }

  const { status } = body as { status: string }

  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Verify the order belongs to this supplier
  const supplier = await prisma.supplier.findUnique({ where: { userId } })
  if (!supplier) {
    return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.supplierId !== supplier.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' },
  })

  return NextResponse.json({ order: updated })
}
