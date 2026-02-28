import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [
    totalIncidents,
    totalRescued,
    totalAnimals,
    activeNGOs,
    totalSponsors,
  ] = await Promise.all([
    prisma.incidentReport.count(),
    prisma.incidentReport.count({ where: { status: 'RESCUED' } }),
    prisma.animal.count(),
    prisma.nGO.count({ where: { verified: true } }),
    prisma.sponsorship.count({ where: { active: true } }),
  ])

  return NextResponse.json({
    totalIncidents,
    totalRescued,
    totalAnimals,
    activeNGOs,
    totalSponsors,
  })
}
