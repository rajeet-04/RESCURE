// Server-only: scrapes Google Maps tbm=map endpoint to find nearby animal shelters
// Parses the XSSI-prefixed JSON response format used by Google Maps search
// After initial search, enriches each result with place details (rating, photos)
// via the maps/preview/place endpoint using the extracted hex place ID.

export interface ExternalShelter {
  name: string
  address: string
  phone: string | null
  website: string | null
  lat: number
  lng: number
  placeId: string | null
  rating: number | null
  reviewCount: number | null
  photos: string[]
}

const TIMEOUT_MS = 8000
// India bounding box — filter false positives
const IN_LAT = { min: 6, max: 37 }
const IN_LNG = { min: 68, max: 98 }

export async function findNearbyAnimalShelters(
  lat: number,
  lng: number,
  radiusKm = 15
): Promise<ExternalShelter[]> {
  const q = encodeURIComponent('animal shelter near me')
  // Use Near parameter so results are centred on the incident
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=in&q=${q}&near=${lat},${lng}`

  let raw: string
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: 'https://www.google.com/',
      },
    })
    if (!res.ok) return []
    raw = await res.text()
  } catch (err) {
    console.warn('[maps-scraper] fetch error:', err)
    return []
  }

  const shelters = parseResults(raw, lat, lng, radiusKm)

  // Enrich each shelter with place details (rating, photos) in parallel.
  // Failures are swallowed — the base search data is still returned.
  const enriched = await Promise.allSettled(
    shelters.map(async (shelter) => {
      if (!shelter.placeId) return shelter
      const details = await fetchPlaceDetails(shelter.placeId, shelter.lat, shelter.lng)
      return { ...shelter, ...details }
    })
  )

  return enriched
    .filter((r): r is PromiseFulfilledResult<ExternalShelter> => r.status === 'fulfilled')
    .map((r) => r.value)
}

// ── Place detail fetch via maps/preview/place ─────────────────────────────────
// Constructs a minimal pb parameter using the hex place ID and coordinates,
// matching the format used by Google Maps internal preview endpoint.

async function fetchPlaceDetails(
  placeId: string,
  lat: number,
  lng: number
): Promise<Pick<ExternalShelter, 'rating' | 'reviewCount' | 'photos'>> {
  const encodedId = encodeURIComponent(placeId)
  // Minimal pb: place ID + viewport centred on coordinates
  const pb =
    `!1m22!1s${encodedId}` +
    `!3m12!1m3!1d268161!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i640!2i875!4f13.1` +
    `!4m2!3d${lat}!4d${lng}`

  const url = `https://www.google.com/maps/preview/place?authuser=0&hl=en&gl=in&pb=${pb}`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        Referer: 'https://www.google.com/',
      },
    })
    if (!res.ok) return { rating: null, reviewCount: null, photos: [] }
    const raw = await res.text()
    return parsePlaceDetails(raw)
  } catch (err) {
    console.warn('[maps-scraper] fetchPlaceDetails error:', err)
    return { rating: null, reviewCount: null, photos: [] }
  }
}

// Parses the XSSI-prefixed place preview response.
// Extracts rating, review count, and photo URLs.
function parsePlaceDetails(
  raw: string
): Pick<ExternalShelter, 'rating' | 'reviewCount' | 'photos'> {
  let rating: number | null = null
  let reviewCount: number | null = null

  // Pattern from the response structure:
  // null,null,null,["https://...reviews?...", "{N} reviews", ...], null, null, null, RATING, COUNT]
  const ratingRe =
    /,null,null,null,\["[^"]+",("(\d+) reviews"[^\]]*\]|"[^"]+"),null,null,null,(\d+\.?\d*),(\d+)\]/
  const rm = ratingRe.exec(raw)
  if (rm) {
    // group 2 = review count digits, group 3 = rating, group 4 = total count
    const countMatch = rm[0].match(/(\d+) reviews/)
    if (countMatch) reviewCount = parseInt(countMatch[1], 10)
    // rating is the first float after the last three nulls before review count
    const ratingMatch = rm[0].match(/null,(\d+\.\d+),(\d+)\]$/)
    if (ratingMatch) rating = parseFloat(ratingMatch[1])
  }

  // Photo URLs: lh3.googleusercontent.com/gps-cs-s/... with size suffix
  // The raw response encodes '=' as '\u003d'; handle both forms.
  const photoRe =
    /"(https:\/\/lh3\.googleusercontent\.com\/gps-cs-s\/[^"\\]{30,})(?:\\u003d|=)w\d+-h\d+-[^"\\]*k-no[^"]*"/g
  const photos: string[] = []
  const seenPhotos = new Set<string>()
  let pm: RegExpExecArray | null
  while ((pm = photoRe.exec(raw)) !== null && photos.length < 5) {
    const base = pm[1]
    if (!seenPhotos.has(base)) {
      seenPhotos.add(base)
      photos.push(`${base}=w800-h600-k-no`)
    }
  }

  return { rating, reviewCount, photos }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function parseResults(
  raw: string,
  originLat: number,
  originLng: number,
  radiusKm: number
): ExternalShelter[] {
  const results: ExternalShelter[] = []
  const seen = new Set<string>()

  // ── Extract coord pairs [null,null,LAT,LNG] ────────────────────────────────
  // Verified pattern from data/f.txt
  const coordRe = /\[null,null,([\d]+\.[\d]+),([\d]+\.[\d]+)\]/g

  // ── Extract hex place IDs: "0x{hex}:0x{hex}" ─────────────────────────────
  const placeIdRe = /"(0x[0-9a-f]+:0x[0-9a-f]+)"/g

  // ── Extract phone numbers from tel:DIGITS pattern ─────────────────────────
  const phoneRe = /"tel:(\d{7,15})"/g

  // ── Extract display phone with context: [[["DISPLAY",1],["+91 ...",2]],null,"DIGITS" ─
  const phonePairRe = /\[\["([^"]{6,25})",1\],\["\+?91[^"]{6,20}",2\]\],null,"(\d{7,15})"/g

  // ── Extract websites (non-Google domains) ─────────────────────────────────
  const websiteRe = /\["(https?:\/\/(?!(?:www\.google|gstatic|googleapis|googleusercontent|business\.google)[^"]*)[^"]{5,200})","([^"]{3,50})"/g

  // ── Extract names from [[7,[["NAME"] nested structure ─────────────────────
  // Verified from data/f.txt: [[7,[["Choynavi Animal Shelter"],["addr"]...
  const nameRe = /\[\[\[7,\[\["([^"]{3,80})"/g

  // Verified second name pattern: "PLACE_NAME",null,["Animal shelter" or "Animal hospital"
  const namePlaceRe = /"([^"]{3,80})",null,\[(?:"[Aa]nimal|"[Vv]eterinarian|"[Nn]on.gov|"[Pp]et)/g

  // ── Collect all matches with their string positions ───────────────────────
  type Indexed<T> = T & { idx: number }

  const coords: Indexed<{ lat: number; lng: number }>[] = []
  const placeIds: Indexed<{ id: string }>[] = []
  let m: RegExpExecArray | null

  while ((m = coordRe.exec(raw)) !== null) {
    const la = parseFloat(m[1])
    const lo = parseFloat(m[2])
    if (la > IN_LAT.min && la < IN_LAT.max && lo > IN_LNG.min && lo < IN_LNG.max) {
      coords.push({ lat: la, lng: lo, idx: m.index })
    }
  }

  while ((m = placeIdRe.exec(raw)) !== null) {
    placeIds.push({ id: m[1], idx: m.index })
  }

  const phones: Indexed<{ digits: string }>[] = []
  while ((m = phonePairRe.exec(raw)) !== null) {
    phones.push({ digits: m[2], idx: m.index })
  }
  if (phones.length === 0) {
    while ((m = phoneRe.exec(raw)) !== null) {
      phones.push({ digits: m[1], idx: m.index })
    }
  }

  const websites: Indexed<{ url: string }>[] = []
  while ((m = websiteRe.exec(raw)) !== null) {
    websites.push({ url: m[1], idx: m.index })
  }

  const names: Indexed<{ name: string }>[] = []
  while ((m = nameRe.exec(raw)) !== null) {
    if (!m[1].startsWith('http')) names.push({ name: m[1], idx: m.index })
  }
  while ((m = namePlaceRe.exec(raw)) !== null) {
    if (!m[1].startsWith('http') && !names.some((n) => n.name === m![1])) {
      names.push({ name: m[1], idx: m.index })
    }
  }

  // ── Extract addresses: full form "Name, Street, Area, City, State PINCODE" ─
  const addrRe = /"([^"]{10,250}(?:West Bengal|Maharashtra|Karnataka|Tamil Nadu|Delhi|Gujarat|Rajasthan|Uttar Pradesh|Telangana|Andhra Pradesh|Kerala|Madhya Pradesh|Bihar|Punjab|Haryana)[^"]{0,60})"/g
  const addrs: Indexed<{ addr: string }>[] = []
  while ((m = addrRe.exec(raw)) !== null) {
    addrs.push({ addr: m[1], idx: m.index })
  }

  // ── Associate by index proximity ──────────────────────────────────────────
  for (const coord of coords) {
    if (haversineKm(originLat, originLng, coord.lat, coord.lng) > radiusKm) continue
    const key = `${coord.lat.toFixed(4)},${coord.lng.toFixed(4)}`
    if (seen.has(key)) continue
    seen.add(key)

    const WINDOW = 6000

    const closestName = names
      .filter((n) => n.idx < coord.idx && coord.idx - n.idx < WINDOW * 2)
      .sort((a, b) => b.idx - a.idx)[0]

    if (!closestName) continue

    const closestPhone = phones
      .filter((p) => Math.abs(p.idx - coord.idx) < WINDOW)
      .sort((a, b) => Math.abs(a.idx - coord.idx) - Math.abs(b.idx - coord.idx))[0]

    const closestWebsite = websites
      .filter((w) => Math.abs(w.idx - coord.idx) < WINDOW * 1.5)
      .sort((a, b) => Math.abs(a.idx - coord.idx) - Math.abs(b.idx - coord.idx))[0]

    const closestAddr = addrs
      .filter((a) => Math.abs(a.idx - coord.idx) < WINDOW * 2)
      .sort((a, b) => Math.abs(a.idx - coord.idx) - Math.abs(b.idx - coord.idx))[0]

    const closestPlaceId = placeIds
      .filter((p) => Math.abs(p.idx - coord.idx) < WINDOW * 3)
      .sort((a, b) => Math.abs(a.idx - coord.idx) - Math.abs(b.idx - coord.idx))[0]

    results.push({
      name: closestName.name,
      address: closestAddr?.addr ?? '',
      phone: closestPhone?.digits ?? null,
      website: closestWebsite?.url ?? null,
      lat: coord.lat,
      lng: coord.lng,
      placeId: closestPlaceId?.id ?? null,
      rating: null,
      reviewCount: null,
      photos: [],
    })

    if (results.length >= 10) break
  }

  return results
}
