'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface MonthlyTrendItem {
  month: string
  count: number
}

interface UrgencyItem {
  level: string
  count: number
}

interface TopWorker {
  name: string
  casesResolved: number
}

interface NGOAnalyticsChartsProps {
  monthlyTrend: MonthlyTrendItem[]
  urgencyBreakdown: UrgencyItem[]
  topWorkers: TopWorker[]
}

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
}

export default function NGOAnalyticsCharts({
  monthlyTrend,
  urgencyBreakdown,
  topWorkers,
}: NGOAnalyticsChartsProps) {
  const maxUrgency = Math.max(...urgencyBreakdown.map((u) => u.count), 1)

  return (
    <div className="space-y-6">
      {/* Monthly Trend Bar Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cases — Last 6 Months</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Urgency Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cases by Urgency</h3>
        <div className="space-y-2">
          {urgencyBreakdown.map((u) => (
            <div key={u.level} className="flex items-center gap-3">
              <span className="text-xs w-16 font-medium" style={{ color: URGENCY_COLORS[u.level] ?? '#888' }}>
                {u.level}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(u.count / maxUrgency) * 100}%`,
                    backgroundColor: URGENCY_COLORS[u.level] ?? '#888',
                  }}
                />
              </div>
              <span className="text-xs w-6 text-right text-muted-foreground">{u.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Workers */}
      {topWorkers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Field Workers</h3>
          <div className="space-y-2">
            {topWorkers.map((w, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="font-medium">{w.name}</span>
                </div>
                <span className="text-muted-foreground text-xs">{w.casesResolved} cases</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
