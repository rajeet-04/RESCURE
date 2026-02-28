'use client'

import { useState } from 'react'
import RescueFeed from './rescue-feed'
import Leaderboard from './leaderboard'
import BadgesPanel from './badges-panel'

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

type LeaderboardData = {
  topReporters: { userId: string; name: string | null; image: string | null; count: number }[]
  topNGOs: { ngoId: string; name: string; logo: string | null; count: number }[]
}

const TABS = [
  { id: 'feed', label: '🐾 Recent Rescues' },
  { id: 'leaderboard', label: '🏆 Leaderboard' },
  { id: 'badges', label: '🏅 My Badges' },
]

export default function CommunityTabs({
  feedItems,
  leaderboard,
  isAuthenticated,
}: {
  feedItems: FeedItem[]
  leaderboard: LeaderboardData
  isAuthenticated: boolean
}) {
  const [active, setActive] = useState('feed')

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              active === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === 'feed' && <RescueFeed items={feedItems} />}
      {active === 'leaderboard' && <Leaderboard data={leaderboard} />}
      {active === 'badges' && <BadgesPanel isAuthenticated={isAuthenticated} />}
    </div>
  )
}
