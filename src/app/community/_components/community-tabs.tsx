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

/**
 * Render the community tab interface that switches between the rescue feed, leaderboard, and badges panel.
 *
 * @param feedItems - Array of rescue posts displayed in the Feed tab
 * @param leaderboard - Data for the Leaderboard tab (top reporters and NGOs)
 * @param isAuthenticated - Whether the current user is authenticated (controls badges panel behavior)
 * @returns The React element that renders tab buttons and the currently selected tab panel
 */
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
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 ${
              active === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
