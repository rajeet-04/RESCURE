import { prisma } from '@/lib/prisma'
import VolunteerButton from './_components/volunteer-button'
import SurgeMapLoader from '@/components/maps/surge-map-loader'

interface SurgeEvent {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  radius: number
  createdAt: Date
  volunteerCount: number
}

async function getSurgeEvents(): Promise<SurgeEvent[]> {
  const events = await prisma.notification.findMany({
    where: { type: 'SURGE_EVENT' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  return events.map((e) => {
    const payload = e.payload as { lat?: number; lng?: number; radius?: number; volunteerCount?: number } | null
    return {
      id: e.id,
      title: e.title,
      description: e.body,
      lat: payload?.lat ?? 20.5937,
      lng: payload?.lng ?? 78.9629,
      radius: payload?.radius ?? 5,
      createdAt: e.createdAt,
      volunteerCount: payload?.volunteerCount ?? 0,
    }
  })
}

export default async function SurgePage() {
  const events = await getSurgeEvents()
  const hasActiveSurge = events.length > 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {hasActiveSurge ? (
        <>
          {/* Hero Banner */}
          <div className="bg-red-600 py-6 text-center">
            <h1 className="text-3xl font-black uppercase tracking-wider animate-pulse">
              🚨 SURGE MODE ACTIVE
            </h1>
            <p className="mt-2 text-red-100">
              Animal rescue emergency — volunteers needed now!
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-8 p-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-red-500 bg-gray-900 p-6"
              >
                <h2 className="text-xl font-bold text-red-400">{event.title}</h2>
                <p className="mt-2 text-gray-300">{event.description}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Zone radius: {event.radius} km ·{' '}
                  {new Date(event.createdAt).toLocaleString()}
                </p>

                {/* Map */}
                <div className="mt-4 h-72 overflow-hidden rounded-lg">
                  <SurgeMapLoader lat={event.lat} lng={event.lng} radius={event.radius} />
                </div>

                {/* Instructions */}
                <div className="mt-6 rounded-lg bg-gray-800 p-4">
                  <h3 className="font-semibold text-yellow-400">
                    Instructions for Volunteers
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-300">
                    <li>Report to the surge zone marked on the map above</li>
                    <li>Contact the nearest NGO for assignment</li>
                    <li>Bring water, towels, and basic first aid if possible</li>
                    <li>
                      Do NOT approach aggressive animals without trained personnel
                    </li>
                  </ul>
                </div>

                <VolunteerButton surgeId={event.id} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">🕊️</div>
            <h1 className="text-2xl font-bold text-gray-300">No Active Surge Events</h1>
            <p className="mt-2 text-gray-500">
              Everything is calm. Thank you for checking in!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
