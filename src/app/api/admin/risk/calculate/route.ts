import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runPredictiveEngineForAllZones } from '@/lib/ai/predictive-engine'

export async function POST() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runPredictiveEngineForAllZones()

  return NextResponse.json(result)
}
