import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runPredictiveEngineForAllZones } from '@/lib/ai/predictive-engine'
import { ingestLiveRiskFactors } from '@/lib/ai/live-risk-ingestion'

export async function POST() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { factorsCreated } = await ingestLiveRiskFactors()
  const { zonesAnalyzed, surgesTriggered } = await runPredictiveEngineForAllZones()

  return NextResponse.json({ zonesAnalyzed, surgesTriggered, riskFactorsCreated: factorsCreated })
}
