'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Heart } from 'lucide-react'

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
  HIGH: 'bg-yellow-100 text-yellow-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
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
      <div className="text-center py-20 text-gray-500">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-5">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <p className="text-xl font-bold text-gray-900 mb-2">No rescues yet</p>
        <p className="text-gray-500 mb-6">Be the first to report and make a difference!</p>
        <Link
          href="/report"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all group">
            {/* Photo */}
            <div className="h-52 bg-gray-50 flex items-center justify-center overflow-hidden">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={animalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <Heart className="w-12 h-12 text-gray-200" />
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2.5 gap-2">
                <h3 className="font-bold text-gray-900 capitalize truncate text-base">{animalName}</h3>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${urgencyClass}`}>
                    {item.report.urgencyScore}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${stateClass}`}>
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
