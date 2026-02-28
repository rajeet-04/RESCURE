// POST /api/incidents/[id]/notify-external
// Internal-only route guarded by x-internal-key header.
// 1. Scrapes nearby animal shelters via Google Maps
// 2. Queries verified DB NGOs by geohash proximity
// 3. Creates Bitrix24 leads for external shelters
// 4. Sends push notifications + email to DB-tracked NGO users
// 5. Records all outreach attempts in NGOOutreach table

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findNearbyAnimalShelters } from '@/lib/geo/maps-scraper'
import { encodeGeohash, getNeighborHashes } from '@/lib/geo/geohash'
import { createNGOLead, logCallActivity } from '@/lib/bitrix24/client'
import { sendPushToUser } from '@/lib/push/server'
import { resend } from '@/lib/resend'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Internal API key guard
  const key = req.headers.get('x-internal-key')
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const incident = await prisma.incidentReport.findUnique({
    where: { id },
    select: {
      id: true,
      lat: true,
      lng: true,
      geohash: true,
      title: true,
      description: true,
      animalType: true,
      address: true,
      photos: true,
    },
  })

  if (!incident) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
  }

  const incidentTitle = incident.title ?? 'Animal in distress'
  const incidentDesc =
    incident.description ??
    `An ${incident.animalType ?? 'animal'} was reported near ${incident.address ?? 'this location'}.`

  const outreachRecords: {
    incidentId: string
    name: string
    address: string | null
    phone: string | null
    email: string | null
    website: string | null
    lat: number | null
    lng: number | null
    source: string
    contactType: string
    status: string
    bitrix24LeadId: string | null
    errorMsg: string | null
    sentAt: Date | null
  }[] = []

  let externalContacted = 0

  // ── 1. External shelters via Google Maps scraper ───────────────────────────
  try {
    const shelters = await findNearbyAnimalShelters(incident.lat, incident.lng, 15)

    await Promise.allSettled(
      shelters.map(async (shelter) => {
        let leadId: string | null = null
        let status = 'pending'
        let errorMsg: string | null = null
        let sentAt: Date | null = null

        try {
          leadId = await createNGOLead({
            name: shelter.name,
            phone: shelter.phone,
            website: shelter.website,
            address: shelter.address,
            incidentId: incident.id,
            incidentDescription: incidentDesc,
            lat: shelter.lat,
            lng: shelter.lng,
          })

          if (leadId) {
            if (shelter.phone) {
              await logCallActivity({
                leadId,
                subject: `[RESCURE] Follow-up call – ${incidentTitle}`,
                description: incidentDesc,
                phone: shelter.phone,
              })
            }
            status = 'sent'
            sentAt = new Date()
            externalContacted++
          } else {
            // Bitrix24 not configured — still mark as "pending" to track
            status = 'pending'
          }
        } catch (err) {
          status = 'failed'
          errorMsg = String(err)
        }

        outreachRecords.push({
          incidentId: incident.id,
          name: shelter.name,
          address: shelter.address || null,
          phone: shelter.phone,
          email: null,
          website: shelter.website,
          lat: shelter.lat,
          lng: shelter.lng,
          source: 'google_maps',
          contactType: 'bitrix24_lead',
          status,
          bitrix24LeadId: leadId,
          errorMsg,
          sentAt,
        })
      })
    )
  } catch (err) {
    console.warn('[notify-external] shelter scrape failed:', err)
  }

  // ── 2. Verified DB NGOs by geohash proximity ───────────────────────────────
  let dbNGOsContacted = 0

  try {
    const geohash5 = encodeGeohash(incident.lat, incident.lng, 5)
    const neighborHashes = getNeighborHashes(geohash5)

    const ngos = await prisma.nGO.findMany({
      where: {
        verified: true,
        coverageZones: { some: { geohash: { in: neighborHashes } } },
      },
      include: {
        user: { select: { email: true } },
        fieldWorkers: { select: { userId: true } },
      },
    })

    const pushPayload = {
      title: `🚨 New animal incident nearby`,
      body: `${incidentTitle} – ${incident.address ?? 'Unknown location'}`,
      icon: '/icons/icon-192x192.png',
      url: `/incidents/${incident.id}`,
    }

    await Promise.allSettled(
      ngos.map(async (ngo) => {
        let status = 'sent'
        let errorMsg: string | null = null

        try {
          // Push to all field workers
          await Promise.allSettled(
            ngo.fieldWorkers.map((fw) => sendPushToUser(fw.userId, pushPayload))
          )

          // Email to NGO owner
          if (ngo.user.email) {
            await resend.emails.send({
              from: 'RESCURE <alerts@rescure.in>',
              to: ngo.user.email,
              subject: `[RESCURE] Animal incident near your zone`,
              html: `
                <h2>${incidentTitle}</h2>
                <p>${incidentDesc}</p>
                <p><strong>Location:</strong> ${incident.address ?? `${incident.lat}, ${incident.lng}`}</p>
                ${incident.photos?.[0] ? `<img src="${incident.photos[0]}" alt="Incident photo" style="max-width:480px;" />` : ''}
                <p><a href="${process.env.NEXTAUTH_URL ?? 'https://rescure.in'}/cases">View in dashboard →</a></p>
              `,
            })
          }

          dbNGOsContacted++
        } catch (err) {
          status = 'failed'
          errorMsg = String(err)
        }

        outreachRecords.push({
          incidentId: incident.id,
          name: ngo.name,
          address: null,
          phone: null,
          email: ngo.user.email ?? null,
          website: null,
          lat: null,
          lng: null,
          source: 'db',
          contactType: ngo.user.email ? 'email' : 'push',
          status,
          bitrix24LeadId: null,
          errorMsg,
          sentAt: status === 'sent' ? new Date() : null,
        })
      })
    )
  } catch (err) {
    console.warn('[notify-external] DB NGO query failed:', err)
  }

  // ── 3. Persist outreach records ────────────────────────────────────────────
  if (outreachRecords.length > 0) {
    await prisma.nGOOutreach.createMany({ data: outreachRecords }).catch((err) => {
      console.error('[notify-external] createMany error:', err)
    })
  }

  return NextResponse.json({
    externalContacted,
    dbNGOsContacted,
    totalOutreach: outreachRecords.length,
  })
}
