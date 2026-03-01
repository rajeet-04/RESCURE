// POST /api/incidents/[id]/analyze
// Fire-and-forget AI analysis of uploaded photo. No auth required — called immediately
// after incident creation to pre-populate Step 2 wizard fields.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeReport } from '@/lib/ai/report-analyzer'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const incident = await prisma.incidentReport.findUnique({
      where: { id },
      select: { id: true, photos: true },
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const imageUrl = incident.photos?.[0] ?? null

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No photo attached to incident' },
        { status: 422 }
      )
    }

    // Fetch the image and convert to base64
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Could not fetch image' }, { status: 422 })
    }

    const mimeType = (imgRes.headers.get('content-type') ?? 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp'

    const arrayBuffer = await imgRes.arrayBuffer()
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64')

    const analysis = await analyzeReport(imageBase64, mimeType)

    // Persist key fields back to incident
    await prisma.incidentReport.update({
      where: { id },
      data: {
        urgencyScore: analysis.urgency,
        ...(analysis.raw != null ? { aiRawResponse: analysis.raw } : {}),
        animalType: analysis.animalType,
        title: analysis.suggestedTitle,
      },
    })

    return NextResponse.json({
      urgency: analysis.urgency,
      confidence: analysis.confidence,
      animalType: analysis.animalType,
      suggestedTitle: analysis.suggestedTitle,
      suggestedDescription: analysis.suggestedDescription,
      injuryDescription: analysis.injuryDescription,
      recommendedAction: analysis.recommendedAction,
      estimatedAge: analysis.estimatedAge ?? null,
    })
  } catch (err) {
    console.error('[POST /api/incidents/[id]/analyze] error:', err)
    // Return a safe default so the wizard can still proceed
    return NextResponse.json({
      urgency: 'MEDIUM',
      confidence: 0,
      animalType: 'Other',
      suggestedTitle: 'Animal needs help',
      suggestedDescription: 'An animal in distress was reported.',
      injuryDescription: 'Image analysis unavailable.',
      recommendedAction: 'Contact a nearby veterinarian or animal shelter.',
      estimatedAge: null,
    })
  }
}
