'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type FeedItem = {
  id: string
  state: string
  createdAt: string
  report: {
    lat: number
    lng: number
    photos: string[]
    urgencyScore: string
    description: string | null
    address: string | null
  }
  ngo: {
    name: string
    logo: string | null
    city: string | null
  }
  animal: {
    name: string | null
    species: string
    photos: string[]
    publicSlug: string | null
  } | null
}

const urgencyColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
}

const stateColors: Record<string, string> = {
  RESCUED: 'bg-blue-100 text-blue-700',
  IN_CARE: 'bg-purple-100 text-purple-700',
  RELEASED: 'bg-green-100 text-green-700',
}

export default function RescueFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-4">🐾</p>
        <p className="text-lg font-medium">No rescues yet — be the first to report!</p>
        <Link
          href="/report"
          className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Report an Animal
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => {
        const photo = item.animal?.photos[0] ?? item.report.photos[0] ?? null
        const animalName = item.animal?.name ?? item.animal?.species ?? 'Animal'
        const urgencyClass = urgencyColors[item.report.urgencyScore] ?? 'bg-gray-100 text-gray-700'
        const stateClass = stateColors[item.state] ?? 'bg-gray-100 text-gray-700'

        const card = (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Photo */}
            <div className="h-48 bg-orange-50 flex items-center justify-center overflow-hidden">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={animalName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl opacity-30">🐾</span>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-semibold text-gray-900 capitalize truncate">{animalName}</h3>
                <div className="flex gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyClass}`}>
                    {item.report.urgencyScore}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stateClass}`}>
                    {item.state.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {item.report.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.report.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  {item.ngo.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.ngo.logo} alt={item.ngo.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <span>🏥</span>
                  )}
                  <span className="font-medium text-gray-700">{item.ngo.name}</span>
                  {item.ngo.city && <span>· {item.ngo.city}</span>}
                </div>
                <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        )

        return item.animal?.publicSlug ? (
          <Link key={item.id} href={`/animals/${item.animal.publicSlug}`}>
            {card}
          </Link>
        ) : (
          <div key={item.id}>{card}</div>
        )
      })}
    </div>
  )
}
