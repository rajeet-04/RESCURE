'use client'

import { useEffect, useState } from 'react'

type Badge = {
  id: string
  name: string
  description: string
  icon: string
  threshold: number
  earned: boolean
  progress: number
}

type BadgesResponse = {
  badges: Badge[]
  totalReports: number
}

export default function BadgesPanel({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [data, setData] = useState<BadgesResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    fetch('/api/community/badges')
      .then((r) => r.json())
      .then((d: BadgesResponse) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🏆</p>
        <p className="text-lg font-medium text-gray-700">Sign in to track your badges</p>
        <a
          href="/login"
          className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Sign In
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-36 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-center text-gray-500 py-8">Failed to load badges.</p>
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        You have submitted <span className="font-bold text-orange-600">{data.totalReports}</span> report
        {data.totalReports !== 1 ? 's' : ''} total.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.badges.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-2xl border p-5 transition-all ${
              badge.earned
                ? 'bg-orange-50 border-orange-200 shadow-sm'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{badge.icon}</span>
              <div>
                <p className={`font-bold text-sm ${badge.earned ? 'text-orange-700' : 'text-gray-500'}`}>
                  {badge.name}
                  {badge.earned && <span className="ml-1">✓</span>}
                </p>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </div>
            </div>

            {!badge.earned && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{badge.progress}</span>
                  <span>{badge.threshold}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-orange-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${(badge.progress / badge.threshold) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
