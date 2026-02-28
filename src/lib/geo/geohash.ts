import ngeohash from 'ngeohash'

export const GEOHASH_PRECISION = 6    // ~1.2km x 0.6km
export const DEDUP_PRECISION   = 5    // ~5km x 5km — for NGO zone matching

/**
 * Encode lat/lng to geohash
 */
export function encodeGeohash(lat: number, lng: number, precision = GEOHASH_PRECISION): string {
  return ngeohash.encode(lat, lng, precision)
}

/**
 * Get a geohash and all 8 neighboring geohashes (for proximity search)
 */
export function getNeighborHashes(geohash: string): string[] {
  const neighbors = ngeohash.neighbors(geohash)
  return [geohash, ...Object.values(neighbors)]
}

/**
 * Check if two geohashes are within N km of each other
 * Uses precision-5 prefix comparison (~5km zones)
 */
export function areProbablyDuplicates(hash1: string, hash2: string): boolean {
  return hash1.substring(0, DEDUP_PRECISION) === hash2.substring(0, DEDUP_PRECISION)
}

/**
 * Decode geohash to lat/lng bounding box
 */
export function decodeGeohash(geohash: string) {
  return ngeohash.decode_bbox(geohash)
}

/**
 * Distance in km between two lat/lng points (Haversine)
 */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
