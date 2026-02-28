'use client'

import { Medal, Trophy, Award, Building2 } from 'lucide-react'

type TopReporter = {
  userId: string
  name: string | null
  image: string | null
  count: number
}

type TopNGO = {
  ngoId: string
  name: string
  logo: string | null
  count: number
}

type LeaderboardData = {
  topReporters: TopReporter[]
  topNGOs: TopNGO[]
}

const rankIcon = (i: number) => {
  if (i === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
  if (i === 1) return <Medal className="w-5 h-5 text-gray-400" />
  if (i === 2) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm font-bold text-gray-500">#{i + 1}</span>
}

function LeaderboardColumn<T extends { count: number }>({
  title,
  icon: Icon,
  items,
  renderItem,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">No data yet</p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-green-100 hover:border-green-200 transition-all"
            style={{ animationDelay: `${i * 60}ms`, animation: 'fadeSlideIn 0.3s ease both' }}
          >
            <div className="w-8 flex items-center justify-center">{rankIcon(i)}</div>
            {renderItem(item, i)}
            <span className="ml-auto font-bold text-primary text-sm">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Leaderboard({ data }: { data: LeaderboardData }) {
  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col md:flex-row gap-8">
        <LeaderboardColumn
          title="Top Reporters"
          icon={Award}
          items={data.topReporters}
          renderItem={(reporter) => (
            <div className="flex items-center gap-2 min-w-0">
              {reporter.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reporter.image}
                  alt={reporter.name ?? 'User'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-green-200"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border-2 border-green-200">
                  {reporter.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <span className="text-sm font-medium text-gray-700 truncate">
                {reporter.name ?? 'Anonymous'}
              </span>
            </div>
          )}
        />

        <LeaderboardColumn
          title="Top NGOs"
          icon={Building2}
          items={data.topNGOs}
          renderItem={(ngo) => (
            <div className="flex items-center gap-2 min-w-0">
              {ngo.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ngo.logo}
                  alt={ngo.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-green-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-green-200">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 truncate">{ngo.name}</span>
            </div>
          )}
        />
      </div>
    </>
  )
}
