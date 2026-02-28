import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { encodeGeohash } from '@/lib/geo/geohash'

const CITY_COORDS: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.877], Delhi: [28.644, 77.216], Bangalore: [12.972, 77.594],
  Chennai: [13.083, 80.270], Hyderabad: [17.385, 78.486], Pune: [18.524, 73.856],
  Ahmedabad: [23.023, 72.572], Kolkata: [22.573, 88.364], Surat: [21.195, 72.830],
  Jaipur: [26.912, 75.787],
}

const onboardSchema = z.object({
  name: z.string().min(3),
  city: z.string().min(2),
  registrationNumber: z.string().min(3),
  // wizard sends a comma-separated string; coverageCities array is also accepted
  coverageArea: z.string().optional(),
  coverageCities: z.array(z.string()).optional(),
  teamSize: z.string().optional(),
  primaryContact: z.string().optional(),
}).refine(
  (d) => d.coverageCities?.length || d.coverageArea,
  { message: 'Coverage area is required', path: ['coverageArea'] },
)

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = onboardSchema.safeParse(body)
    if (!parsed.success) {
      const flat = parsed.error.flatten()
      const messages = [
        ...flat.formErrors,
        ...Object.entries(flat.fieldErrors).map(
          ([field, errs]) => `${field}: ${errs?.join(', ')}`
        ),
      ]
      return NextResponse.json(
        { error: messages.join(' | ') || 'Validation failed' },
        { status: 400 },
      )
    }

    const { name, city, registrationNumber, coverageCities, coverageArea } = parsed.data
    // Normalise coverage: prefer the array, fall back to parsing the free-text string
    const resolvedCities: string[] =
      coverageCities ??  
      (coverageArea ? coverageArea.split(',').map((s) => s.trim()).filter(Boolean) : [])

    const ngo = await prisma.nGO.upsert({
      where: { userId: session.user.id },
      update: {
        name,
        city,
        registrationNo: registrationNumber,
        coverageZones: {
          deleteMany: {},
          create: resolvedCities.map((c) => {
            const coords = CITY_COORDS[c]
            return {
              geohash: coords ? encodeGeohash(coords[0], coords[1], 5) : c.toLowerCase().slice(0, 5),
              label: c,
            }
          }),
        },
      },
      create: {
        name,
        city,
        registrationNo: registrationNumber,
        userId: session.user.id,
        tier: 'FREE',
        coverageZones: {
          create: resolvedCities.map((c) => {
            const coords = CITY_COORDS[c]
            return {
              geohash: coords ? encodeGeohash(coords[0], coords[1], 5) : c.toLowerCase().slice(0, 5),
              label: c,
            }
          }),
        },
      },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'NGO_ADMIN' },
    })

    return NextResponse.json({ ngo }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/ngo/onboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
