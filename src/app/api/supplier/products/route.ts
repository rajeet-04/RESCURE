import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'SUPPLIER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId } })
  if (!supplier) {
    return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 })
  }

  const products = await prisma.product.findMany({
    where: { supplierId: supplier.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: userId, role } = session.user as { id: string; role: string }
  if (role !== 'SUPPLIER') {
    return NextResponse.json({ error: 'Only suppliers can add products' }, { status: 403 })
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId } })
  if (!supplier) {
    return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, description, category, priceRetail, priceNGO, unit, stock } = body as {
    name: string
    description?: string
    category: string
    priceRetail: number
    priceNGO: number
    unit: string
    stock: number
  }

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  if (!unit?.trim()) return NextResponse.json({ error: 'Unit is required' }, { status: 400 })

  const validCategories = ['food-dry', 'food-wet', 'medicine', 'accessory']
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const priceRetailInt = parseInt(String(priceRetail), 10)
  const priceNGOInt = parseInt(String(priceNGO), 10)
  const stockInt = parseInt(String(stock), 10)

  if (isNaN(priceRetailInt) || priceRetailInt <= 0) {
    return NextResponse.json({ error: 'Invalid retail price' }, { status: 400 })
  }
  if (isNaN(priceNGOInt) || priceNGOInt <= 0) {
    return NextResponse.json({ error: 'Invalid NGO price' }, { status: 400 })
  }
  if (isNaN(stockInt) || stockInt < 0) {
    return NextResponse.json({ error: 'Invalid stock quantity' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      supplierId: supplier.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      category,
      priceRetail: priceRetailInt,
      priceNGO: priceNGOInt,
      unit: unit.trim(),
      stock: stockInt,
    },
  })

  return NextResponse.json({ product }, { status: 201 })
}
