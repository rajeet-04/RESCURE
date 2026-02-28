'use client'

import { useState } from 'react'
import { Heart, Trophy, Award } from 'lucide-react'
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
  { id: 'feed', label: 'Recent Rescues', Icon: Heart },
  { id: 'leaderboard', label: 'Leaderboard', Icon: Trophy },
  { id: 'badges', label: 'My Badges', Icon: Award },
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
      <div className="flex gap-2 mb-10 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-5 py-2.5 text-sm font-bold rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
              active === tab.id
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.Icon className="w-4 h-4" />
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
