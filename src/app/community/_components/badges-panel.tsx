'use client'

import { useEffect, useState } from 'react'
import { Trophy, Award } from 'lucide-react'

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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-4">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <p className="text-lg font-medium text-gray-700">Sign in to track your badges</p>
        <a
          href="/login"
          className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
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
        You have submitted <span className="font-bold text-primary">{data.totalReports}</span> report
        {data.totalReports !== 1 ? 's' : ''} total.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.badges.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-2xl border p-5 transition-all ${
              badge.earned
                ? 'bg-primary/5 border-green-200 shadow-sm'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{badge.icon}</span>
              <div>
                <p className={`font-bold text-sm ${badge.earned ? 'text-primary' : 'text-gray-500'}`}>
                  {badge.name}
                  {badge.earned && <Award className="inline w-3 h-3 ml-1" />}
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
                    className="bg-primary h-1.5 rounded-full transition-all"
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
