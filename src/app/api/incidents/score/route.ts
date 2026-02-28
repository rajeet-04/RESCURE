import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { scoreInjuryUrgency } from '@/lib/ai/urgency-scorer'

const scoreSchema = z.object({
  incidentId: z.string(),
  imageUrl: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = scoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { incidentId, imageUrl } = parsed.data

    try {
      let urgency = 'MEDIUM'
      let confidence = 0
      let reasoning = 'No image provided — defaulted to MEDIUM'

      if (imageUrl) {
        // Fetch image and convert to base64 for Gemini
        const imgRes = await fetch(imageUrl)
        const arrayBuffer = await imgRes.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = (imgRes.headers.get('content-type') ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

        const result = await scoreInjuryUrgency(base64, mimeType)
        urgency = result.urgency
        confidence = result.confidence
        reasoning = result.reasoning
      }

      await prisma.incidentReport.update({
        where: { id: incidentId },
        data: { urgencyScore: urgency as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' },
      })

      return NextResponse.json({ urgencyScore: urgency, confidence, reasoning })
    } catch (aiErr) {
      console.error('[score] AI scoring failed, keeping MEDIUM default', aiErr)
      return NextResponse.json({ urgencyScore: 'MEDIUM', confidence: 0, reasoning: 'AI scoring unavailable' })
    }
  } catch (err) {
    console.error('[POST /api/incidents/score]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
