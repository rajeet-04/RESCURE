'use client'

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

const rankEmoji = (i: number) =>
  i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

function LeaderboardColumn<T extends { count: number }>({
  title,
  items,
  renderItem,
}: {
  title: string
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-gray-900 text-lg mb-4">{title}</h3>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">No data yet</p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100"
            style={{ animationDelay: `${i * 60}ms`, animation: 'fadeSlideIn 0.3s ease both' }}
          >
            <span className="text-xl w-8 text-center">{rankEmoji(i)}</span>
            {renderItem(item, i)}
            <span className="ml-auto font-bold text-orange-600 text-sm">{item.count}</span>
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
          title="🏅 Top Reporters"
          items={data.topReporters}
          renderItem={(reporter) => (
            <div className="flex items-center gap-2 min-w-0">
              {reporter.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reporter.image}
                  alt={reporter.name ?? 'User'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-orange-200"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm border-2 border-orange-200">
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
          title="🏥 Top NGOs"
          items={data.topNGOs}
          renderItem={(ngo) => (
            <div className="flex items-center gap-2 min-w-0">
              {ngo.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ngo.logo}
                  alt={ngo.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-orange-200"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs border-2 border-orange-200">
                  🏥
                </span>
              )}
              <span className="text-sm font-medium text-gray-700 truncate">{ngo.name}</span>
            </div>
          )}
        />
      </div>
    </>
  )
}
