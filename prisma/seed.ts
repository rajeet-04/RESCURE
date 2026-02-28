/**
 * RESCURE — Simulation Seed Script
 * Creates: 1 admin, 5 NGOs, 5 residents, field workers,
 * 30 fake incident reports around Kolkata, rescue cases,
 * coverage zones, risk factors, and surge events.
 *
 * Run: npx ts-node --project tsconfig.json -e "require('ts-node/register'); require('./prisma/seed.ts')"
 * Or:  npx prisma db seed
 */

import { PrismaClient, Role, UrgencyLevel, ReportStatus, AnimalStatus } from '@prisma/client'
import ngeohash from 'ngeohash'

const prisma = new PrismaClient()

// ─── Helpers ───────────────────────────────────────────────────────────────

function gh(lat: number, lng: number, precision = 6) {
  return ngeohash.encode(lat, lng, precision)
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000)
}

function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3_600_000)
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function jitter(center: number, range: number) {
  return center + (Math.random() - 0.5) * range
}

// ─── Kolkata area locations ─────────────────────────────────────────────────

const KOLKATA_ZONES = [
  { name: 'Dhapa/Manpur',   lat: 22.5418, lng: 88.4440 },
  { name: 'Salt Lake',      lat: 22.5782, lng: 88.4081 },
  { name: 'New Town',       lat: 22.5832, lng: 88.4754 },
  { name: 'Park Street',    lat: 22.5533, lng: 88.3516 },
  { name: 'Jadavpur',       lat: 22.4979, lng: 88.3714 },
  { name: 'Howrah',         lat: 22.5787, lng: 88.2946 },
  { name: 'Dumdum',         lat: 22.6552, lng: 88.3999 },
  { name: 'Behala',         lat: 22.5006, lng: 88.3091 },
  { name: 'Ultadanga',      lat: 22.5909, lng: 88.3891 },
  { name: 'Garden Reach',   lat: 22.5198, lng: 88.3073 },
]

// ─── Seed ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding RESCURE simulation data...\n')

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rescure.dev' },
    update: {},
    create: {
      email: 'admin@rescure.dev',
      name: 'RESCURE Admin',
      role: Role.PLATFORM_ADMIN,
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=admin',
    },
  })
  console.log(`✅ Admin:    ${admin.email}`)

  // ── 2. NGO users + NGO records ────────────────────────────────────────────
  const ngoData = [
    {
      email: 'ngo1@pawskolkata.org',
      name: 'Paws of Kolkata',
      ngoName: 'Paws of Kolkata Rescue',
      zone: KOLKATA_ZONES[0],
      city: 'Kolkata',
    },
    {
      email: 'ngo2@animalaid.kolkata',
      name: 'Animal Aid Kolkata',
      ngoName: 'Animal Aid Kolkata Society',
      zone: KOLKATA_ZONES[1],
      city: 'Kolkata',
    },
    {
      email: 'ngo3@streetvets.in',
      name: 'Street Vets India',
      ngoName: 'Street Vets Welfare India',
      zone: KOLKATA_ZONES[3],
      city: 'Kolkata',
    },
    {
      email: 'ngo4@beastcare.org',
      name: 'BeastCare Foundation',
      ngoName: 'BeastCare Foundation Trust',
      zone: KOLKATA_ZONES[6],
      city: 'Kolkata',
    },
    {
      email: 'ngo5@furryrescue.in',
      name: 'Furry Rescue Bengal',
      ngoName: 'Furry Rescue West Bengal',
      zone: KOLKATA_ZONES[4],
      city: 'Kolkata',
    },
  ]

  const ngoUsers: typeof admin[] = []
  const ngos: { id: string }[] = []

  for (const d of ngoData) {
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        name: d.name,
        role: Role.NGO_ADMIN,
        image: `https://api.dicebear.com/7.x/identicon/svg?seed=${d.email}`,
      },
    })

    const ngo = await prisma.nGO.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        name: d.ngoName,
        description: `${d.ngoName} — rescuing and rehabilitating stray animals in Kolkata.`,
        verified: true,
        verifiedAt: daysAgo(30),
        city: d.city,
        state: 'West Bengal',
        country: 'India',
        activeCaseCount: 0,
        coverageZones: {
          create: {
            geohash: gh(d.zone.lat, d.zone.lng, 5),
            label: d.zone.name,
            baseRiskScore: 0.3,
          },
        },
      },
    })

    ngoUsers.push(u)
    ngos.push(ngo)
    console.log(`✅ NGO:      ${u.email}  →  ${ngo.name}`)
  }

  // ── 3. Field workers (one per NGO) ────────────────────────────────────────
  const workerData = [
    { email: 'worker1@rescure.dev', name: 'Arjun Das',     lat: 22.5420, lng: 88.4445 },
    { email: 'worker2@rescure.dev', name: 'Priya Ghosh',   lat: 22.5790, lng: 88.4085 },
    { email: 'worker3@rescure.dev', name: 'Soumik Roy',    lat: 22.5540, lng: 88.3520 },
    { email: 'worker4@rescure.dev', name: 'Tanisha Paul',  lat: 22.6555, lng: 88.4005 },
    { email: 'worker5@rescure.dev', name: 'Rahul Biswas',  lat: 22.4982, lng: 88.3718 },
  ]

  const fieldWorkers: { id: string }[] = []

  for (let i = 0; i < workerData.length; i++) {
    const d = workerData[i]
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        name: d.name,
        role: Role.NGO_WORKER,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.email}`,
      },
    })

    const fw = await prisma.fieldWorker.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        ngoId: ngos[i].id,
        available: true,
        lat: d.lat,
        lng: d.lng,
        lastSeenAt: hoursAgo(Math.floor(Math.random() * 3)),
      },
    })

    fieldWorkers.push(fw)
    console.log(`✅ Worker:   ${u.email}`)
  }

  // ── 4. Resident / Citizen users ────────────────────────────────────────────
  const residentData = [
    { email: 'resident1@gmail.com',   name: 'Amitava Sen' },
    { email: 'resident2@gmail.com',   name: 'Mitali Chatterjee' },
    { email: 'resident3@ymail.com',   name: 'Debabrata Mondal' },
    { email: 'resident4@outlook.com', name: 'Sunita Sharma' },
    { email: 'resident5@gmail.com',   name: 'Kaushik Bose' },
  ]

  const residents: typeof admin[] = []

  for (const d of residentData) {
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        name: d.name,
        role: Role.CITIZEN,
        image: `https://api.dicebear.com/7.x/personas/svg?seed=${d.email}`,
      },
    })
    residents.push(u)
    console.log(`✅ Resident: ${u.email}`)
  }

  // ── 5. Incident reports (30 reports across Kolkata) ───────────────────────
  console.log('\n📍 Creating incident reports...')

  const animalTypes = ['Dog', 'Cat', 'Cow', 'Dog', 'Dog', 'Cat', 'Cow', 'Dog']
  const urgencies: UrgencyLevel[] = ['CRITICAL', 'HIGH', 'HIGH', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'LOW', 'LOW']
  const statusPool: ReportStatus[] = ['PENDING', 'ASSIGNED', 'EN_ROUTE', 'RESCUED', 'IN_CARE', 'CLOSED']

  const incidents: {
    lat: number; lng: number; animal: string; urgency: UrgencyLevel;
    desc: string; status: ReportStatus; citizenId: string | null; daysBack: number
  }[] = [
    // Dhapa/Manpur cluster (high density — near Choynavi shelter)
    { lat: 22.5418, lng: 88.4440, animal: 'Dog',  urgency: 'CRITICAL', desc: 'Injured dog with deep wound on hind leg, near Manpur canal bridge. Bleeding heavily.', status: 'RESCUED',  citizenId: residents[0].id, daysBack: 12 },
    { lat: 22.5411, lng: 88.4455, animal: 'Dog',  urgency: 'HIGH',     desc: 'Pack of 3 abandoned puppies trapped under debris after construction work at Dhapa.', status: 'IN_CARE',   citizenId: residents[1].id, daysBack: 8  },
    { lat: 22.5425, lng: 88.4430, animal: 'Cat',  urgency: 'MEDIUM',   desc: 'Cat stuck on roof of Manpur market shed for 2 days, unable to come down.', status: 'CLOSED',    citizenId: null,            daysBack: 15 },
    { lat: 22.5432, lng: 88.4420, animal: 'Dog',  urgency: 'CRITICAL', desc: 'Dog hit by truck on Dhapa main road. One leg appears fractured, shock state.', status: 'IN_CARE',   citizenId: residents[2].id, daysBack: 3  },
    { lat: 22.5407, lng: 88.4448, animal: 'Cow',  urgency: 'HIGH',     desc: 'Cow with rope embedded deep in neck wound, limping near Dhapa landfill entrance.', status: 'ASSIGNED',  citizenId: null,            daysBack: 1  },
    { lat: 22.5438, lng: 88.4462, animal: 'Dog',  urgency: 'HIGH',     desc: 'Large dog with mange, heavily infested, near Manpur primary school gate.', status: 'PENDING',   citizenId: residents[3].id, daysBack: 0  },

    // Salt Lake cluster
    { lat: 22.5784, lng: 88.4084, animal: 'Dog',  urgency: 'MEDIUM',   desc: 'Stray dog with parvovirus symptoms near Sector V tech park.', status: 'EN_ROUTE',  citizenId: residents[0].id, daysBack: 2  },
    { lat: 22.5770, lng: 88.4095, animal: 'Cat',  urgency: 'LOW',      desc: 'Injured kitten found near Central Park entry gate, Salt Lake.', status: 'RESCUED',  citizenId: residents[4].id, daysBack: 10 },
    { lat: 22.5800, lng: 88.4060, animal: 'Dog',  urgency: 'HIGH',     desc: 'Dog with maggot wound behind Salt Lake stadium. Needs immediate wound dressing.', status: 'ASSIGNED',  citizenId: null,            daysBack: 1  },

    // New Town / Rajarhat cluster
    { lat: 22.5830, lng: 88.4755, animal: 'Dog',  urgency: 'CRITICAL', desc: 'Dog fallen into open drainage ditch near New Town Action Area II.', status: 'RESCUED',  citizenId: residents[1].id, daysBack: 7  },
    { lat: 22.5845, lng: 88.4740, animal: 'Dog',  urgency: 'MEDIUM',   desc: 'Pregnant stray dog in distress near Eco Park entrance, New Town.', status: 'IN_CARE',   citizenId: residents[2].id, daysBack: 5  },
    { lat: 22.5815, lng: 88.4770, animal: 'Cat',  urgency: 'LOW',      desc: 'Cat with eye infection near Newtown secondary school, limping slightly.', status: 'CLOSED',    citizenId: null,            daysBack: 20 },

    // Park Street / Central Kolkata cluster
    { lat: 22.5531, lng: 88.3518, animal: 'Dog',  urgency: 'HIGH',     desc: 'Old dog collapsed near Park Street cemetery, unresponsive but breathing.', status: 'RESCUED',  citizenId: residents[3].id, daysBack: 6  },
    { lat: 22.5545, lng: 88.3500, animal: 'Cow',  urgency: 'HIGH',     desc: 'Cow struck by vehicle near Chowringhee junction, bleeding from flank.', status: 'ASSIGNED',  citizenId: residents[0].id, daysBack: 1  },
    { lat: 22.5520, lng: 88.3535, animal: 'Dog',  urgency: 'MEDIUM',   desc: 'Limping dog near Mullickbazar, hind leg swelling, been there 2 days.', status: 'PENDING',   citizenId: null,            daysBack: 0  },
    { lat: 22.5560, lng: 88.3490, animal: 'Cat',  urgency: 'LOW',      desc: 'Multiple cats appearing malnourished near Free School Street lane.', status: 'CLOSED',    citizenId: residents[4].id, daysBack: 25 },

    // Jadavpur cluster
    { lat: 22.4981, lng: 88.3712, animal: 'Dog',  urgency: 'CRITICAL', desc: 'Dog with severe burns, possibly acid attack, in Jadavpur 8B bus stand vicinity.', status: 'IN_CARE',   citizenId: residents[1].id, daysBack: 4  },
    { lat: 22.4965, lng: 88.3730, animal: 'Dog',  urgency: 'HIGH',     desc: 'Puppies abandoned in a sack near Jadavpur University south gate.', status: 'RESCUED',  citizenId: residents[2].id, daysBack: 9  },
    { lat: 22.4998, lng: 88.3695, animal: 'Cat',  urgency: 'MEDIUM',   desc: 'Cat trapped inside drainpipe near Jadavpur market, audible for 12 hours.', status: 'CLOSED',    citizenId: null,            daysBack: 18 },

    // Howrah cluster
    { lat: 22.5785, lng: 88.2950, animal: 'Dog',  urgency: 'HIGH',     desc: 'Dog with rope tied around muzzle near Howrah station flower market.', status: 'RESCUED',  citizenId: residents[3].id, daysBack: 11 },
    { lat: 22.5800, lng: 88.2935, animal: 'Cow',  urgency: 'CRITICAL', desc: 'Cow lying on Howrah bridge approach road, unable to stand, causing traffic.', status: 'CLOSED',    citizenId: residents[0].id, daysBack: 14 },
    { lat: 22.5770, lng: 88.2960, animal: 'Dog',  urgency: 'MEDIUM',   desc: 'Three dogs in Howrah Shibpur area with skin disease (ringworm suspected).', status: 'PENDING',   citizenId: null,            daysBack: 0  },

    // Dumdum cluster
    { lat: 22.6550, lng: 88.4000, animal: 'Dog',  urgency: 'HIGH',     desc: 'Injured dog near Dumdum airport back gate, possible hit and run.', status: 'EN_ROUTE',  citizenId: residents[4].id, daysBack: 0  },
    { lat: 22.6565, lng: 88.3985, animal: 'Dog',  urgency: 'MEDIUM',   desc: 'Stray with limb caught in wire near Dumdum Park.', status: 'PENDING',   citizenId: residents[1].id, daysBack: 0  },

    // Behala cluster
    { lat: 22.5008, lng: 88.3093, animal: 'Dog',  urgency: 'HIGH',     desc: 'Dog with distemper symptoms near Behala Chowrasta, highly contagious.', status: 'ASSIGNED',  citizenId: null,            daysBack: 2  },
    { lat: 22.4990, lng: 88.3110, animal: 'Cat',  urgency: 'LOW',      desc: 'Newborn kittens abandoned in box near Behala Thana police station.', status: 'IN_CARE',   citizenId: residents[2].id, daysBack: 3  },

    // Ultadanga cluster
    { lat: 22.5910, lng: 88.3893, animal: 'Dog',  urgency: 'MEDIUM',   desc: 'Dog with bleeding paw, glass wound, near Ultadanga flyover.', status: 'PENDING',   citizenId: residents[3].id, daysBack: 0  },
    { lat: 22.5898, lng: 88.3905, animal: 'Cow',  urgency: 'LOW',      desc: 'Cow with infected horn wound, wandering near Ultadanga station.', status: 'CLOSED',    citizenId: null,            daysBack: 30 },

    // Garden Reach cluster
    { lat: 22.5200, lng: 88.3075, animal: 'Dog',  urgency: 'CRITICAL', desc: 'Dog trapped under collapsed boundary wall near Garden Reach port area.', status: 'RESCUED',  citizenId: residents[4].id, daysBack: 16 },
    { lat: 22.5185, lng: 88.3090, animal: 'Dog',  urgency: 'HIGH',     desc: 'Pack of aggressive dogs biting residents near Garden Reach wharves. Rabies risk.', status: 'CLOSED',    citizenId: residents[0].id, daysBack: 22 },
  ]

  const createdReports: { id: string; lat: number; lng: number; status: ReportStatus; citizenId: string | null }[] = []

  for (const inc of incidents) {
    const geohash = ngeohash.encode(inc.lat, inc.lng, 6)
    const r = await prisma.incidentReport.create({
      data: {
        lat: inc.lat,
        lng: inc.lng,
        geohash,
        description: inc.desc,
        title: `${inc.animal} in distress — ${inc.urgency}`,
        animalType: inc.animal,
        urgencyScore: inc.urgency,
        status: inc.status,
        citizenId: inc.citizenId,
        address: `Kolkata, West Bengal`,
        volunteerHelp: Math.random() > 0.7,
        createdAt: daysAgo(inc.daysBack),
        updatedAt: daysAgo(Math.max(0, inc.daysBack - 1)),
      },
    })
    createdReports.push({ id: r.id, lat: r.lat, lng: r.lng, status: r.status, citizenId: r.citizenId })
  }

  console.log(`✅ Created ${createdReports.length} incident reports`)

  // ── 6. Rescue cases for non-PENDING reports ───────────────────────────────
  console.log('\n🚑 Creating rescue cases...')

  const assignableStatuses: ReportStatus[] = ['ASSIGNED', 'EN_ROUTE', 'RESCUED', 'IN_CARE', 'CLOSED']
  let caseCount = 0

  for (const report of createdReports) {
    if (!assignableStatuses.includes(report.status)) continue

    const ngoIdx = caseCount % ngos.length
    const workerIdx = caseCount % fieldWorkers.length

    const rescueCase = await prisma.rescueCase.create({
      data: {
        reportId: report.id,
        ngoId: ngos[ngoIdx].id,
        workerId: fieldWorkers[workerIdx].id,
        state: report.status,
        slaDeadline: new Date(Date.now() + 86_400_000 * 2),
        createdAt: new Date(Date.now() - Math.random() * 7 * 86_400_000),
      },
    })

    // Create an Animal record for IN_CARE / CLOSED cases
    if (report.status === 'IN_CARE' || report.status === 'CLOSED') {
      const animal = await prisma.animal.create({
        data: {
          caseId: rescueCase.id,
          species: 'dog',
          status: report.status === 'CLOSED' ? AnimalStatus.RELEASED : AnimalStatus.IN_TREATMENT,
          intakeDate: new Date(Date.now() - Math.random() * 10 * 86_400_000),
          name: rand(['Bhola', 'Kalu', 'Moti', 'Sheru', 'Golu', 'Tara', 'Rani', 'Sona', 'Raju', 'Bilu']),
          publicSlug: `animal-${rescueCase.id.slice(-6)}`,
        },
      })
      void animal
    }

    caseCount++
  }

  console.log(`✅ Created ${caseCount} rescue cases`)

  // ── 7. Coverage Zones & Risk Factors ─────────────────────────────────────
  console.log('\n🗺️  Creating risk factors & surge events...')

  const highRiskZones = [
    { lat: 22.5418, lng: 88.4440, reason: 'High stray density near Dhapa landfill',   severity: 0.85 },
    { lat: 22.4981, lng: 88.3712, reason: 'Residential area with repeat reports',       severity: 0.70 },
    { lat: 22.5785, lng: 88.2950, reason: 'Near Howrah station — heavy foot traffic',   severity: 0.75 },
    { lat: 22.6550, lng: 88.4000, reason: 'Airport periphery — stray pack sightings',   severity: 0.65 },
    { lat: 22.5531, lng: 88.3518, reason: 'Central Kolkata — tourist area heat',        severity: 0.60 },
  ]

  for (const zone of highRiskZones) {
    const geohash = ngeohash.encode(zone.lat, zone.lng, 5)
    await prisma.riskFactor.create({
      data: {
        geohash,
        category: rand(['CROWD', 'CONSTRUCTION', 'NOISE', 'WEATHER']),
        severity: zone.severity,
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
    })
  }

  // Surge events
  const surgeEvents = [
    {
      lat: 22.5418, lng: 88.4440,
      title: 'High stray dog activity — Dhapa landfill zone',
      reason: '6 reports in last 48h — coordinate rapid response',
      radiusKm: 3,
    },
    {
      lat: 22.4981, lng: 88.3712,
      title: 'Rabies risk alert — Jadavpur area',
      reason: 'Aggressive dog pack reported biting incidents',
      radiusKm: 2,
    },
    {
      lat: 22.6550, lng: 88.4000,
      title: 'Stray pack sighting — Dumdum airport periphery',
      reason: 'Repeat reports of abandoned animals near airport zones',
      radiusKm: 4,
    },
  ]

  for (const se of surgeEvents) {
    await prisma.surgeEvent.create({
      data: {
        lat: se.lat,
        lng: se.lng,
        geohash: ngeohash.encode(se.lat, se.lng, 5),
        title: se.title,
        reason: se.reason,
        radiusKm: se.radiusKm,
        isActive: true,
        riskScore: 0.7 + Math.random() * 0.25,
        expiresAt: new Date(Date.now() + 3 * 86_400_000),
      },
    })
  }

  console.log('✅ Risk factors and surge events created')

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════╗
║              RESCURE SEED COMPLETE                   ║
╠══════════════════════════════════════════════════════╣
║  Admin:          admin@rescure.dev                   ║
║                                                      ║
║  NGO accounts:   ngo1@pawskolkata.org               ║
║                  ngo2@animalaid.kolkata              ║
║                  ngo3@streetvets.in                  ║
║                  ngo4@beastcare.org                  ║
║                  ngo5@furryrescue.in                 ║
║                                                      ║
║  Residents:      resident1@gmail.com                 ║
║                  resident2@gmail.com                 ║
║                  resident3@ymail.com                 ║
║                  resident4@outlook.com               ║
║                  resident5@gmail.com                 ║
║                                                      ║
║  Field workers:  worker1..5@rescure.dev             ║
║                                                      ║
║  Incidents:      30 reports across Kolkata           ║
║  Rescue cases:   ~20 cases with animals              ║
║  Risk zones:     5 high-risk areas                   ║
║  Surge events:   3 active alerts                     ║
╠══════════════════════════════════════════════════════╣
║  HEATMAP VISIBLE TO:                                 ║
║    ✅  PLATFORM_ADMIN                                ║
║    ✅  NGO_ADMIN                                     ║
║    ❌  CITIZEN / residents                           ║
╚══════════════════════════════════════════════════════╝
`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
