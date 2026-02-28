import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const addExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string(),
  note: z.string().optional(),
  receipt: z.string().optional(),
  date: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expenses = await prisma.expense.findMany({
      where: { animalId: id },
      orderBy: { date: 'desc' },
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({ expenses, total })
  } catch (err) {
    console.error('[GET /api/animals/[id]/expenses]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = addExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { amount, category, note, receipt, date } = parsed.data

    const expense = await prisma.expense.create({
      data: {
        animalId: id,
        amount,
        currency: 'INR',
        category,
        note,
        receipt,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (err) {
    console.error('[POST /api/animals/[id]/expenses]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
