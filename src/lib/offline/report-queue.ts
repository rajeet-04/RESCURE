import { openDB, DBSchema, IDBPDatabase } from 'idb'

export type OfflineReport = {
  id: string
  data: {
    title: string
    description: string
    latitude: number | null
    longitude: number | null
    geohash: string | null
    imageUrls: string[]
    reporterName: string
    reporterPhone: string
    reporterEmail?: string
    city: string
    landmark?: string
  }
  createdAt: number
  synced: boolean
}

interface RescureDB extends DBSchema {
  'pending-reports': {
    key: string
    value: OfflineReport
    indexes: { 'by-synced': number }
  }
}

let dbPromise: Promise<IDBPDatabase<RescureDB>> | null = null

function getDB(): Promise<IDBPDatabase<RescureDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RescureDB>('rescure-offline', 1, {
      upgrade(db) {
        const store = db.createObjectStore('pending-reports', { keyPath: 'id' })
        store.createIndex('by-synced', 'synced')
      },
    })
  }
  return dbPromise
}

export async function saveOfflineReport(data: OfflineReport): Promise<void> {
  const db = await getDB()
  await db.put('pending-reports', data)
}

export async function getPendingReports(): Promise<OfflineReport[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('pending-reports', 'by-synced', 0)
  return all
}

export async function markReportSynced(id: string): Promise<void> {
  const db = await getDB()
  const report = await db.get('pending-reports', id)
  if (report) {
    await db.put('pending-reports', { ...report, synced: true } as unknown as OfflineReport)
  }
}

export async function clearSyncedReports(): Promise<void> {
  const db = await getDB()
  const synced = await db.getAllFromIndex('pending-reports', 'by-synced', 1)
  const tx = db.transaction('pending-reports', 'readwrite')
  await Promise.all([
    ...synced.map((r) => tx.store.delete(r.id)),
    tx.done,
  ])
}
