#!/usr/bin/env node
/**
 * Backfills existing proactive SurgeEvent titles to include human-readable
 * place names resolved via Nominatim reverse-geocoding.
 *
 * Only updates records whose title still matches the old "Zone <geohash>" format.
 *
 * Usage:
 *   node scripts/backfill-surge-titles.js
 *
 * Requires env: DATABASE_URL / DIRECT_URL (loaded from .env.local automatically).
 */
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getPlaceName(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'rescure-backfill' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.address) {
      const addr = data.address
      const parts = []
      if (addr.neighbourhood || addr.neighborhood) parts.push(addr.neighbourhood || addr.neighborhood)
      if (addr.suburb) parts.push(addr.suburb)
      if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village)
      const place = [...new Set(parts)].filter(Boolean).join(', ')
      if (place) return place
    }
    return null
  } catch {
    return null
  }
}

/** Nominatim rate limit: 1 req/sec per usage policy */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  // Only touch proactive surge events with the old title format
  const surges = await prisma.surgeEvent.findMany({
    where: {
      isProactive: true,
      title: { contains: '— Zone ' },
    },
    select: { id: true, geohash: true, lat: true, lng: true, title: true },
  })

  console.log(`Found ${surges.length} surge event(s) to backfill.`)
  if (surges.length === 0) process.exit(0)

  let updated = 0

  for (const surge of surges) {
    const placeName = await getPlaceName(surge.lat, surge.lng)
    if (!placeName) {
      console.log(`  [skip] ${surge.geohash} — could not resolve place name`)
      await sleep(1100)
      continue
    }

    const newTitle = `⚠️ Predictive Surge Risk — ${placeName} (${surge.geohash})`
    await prisma.surgeEvent.update({
      where: { id: surge.id },
      data: { title: newTitle },
    })
    console.log(`  [ok]   ${surge.geohash} → "${newTitle}"`)
    updated++

    // Respect Nominatim's 1 req/sec policy
    await sleep(1100)
  }

  console.log(`\nDone. Updated ${updated}/${surges.length} records.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
