'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface DayCount {
  date: string
  count: number
}

interface ImpactChartsProps {
  trendData: DayCount[]
  urgencyData: { name: string; value: number; color: string }[]
  animalStatusData: { name: string; value: number }[]
}

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#ef4444']

export default function ImpactCharts({ trendData, animalStatusData }: ImpactChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 30-day trend bar chart */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-600">Reports — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => v.slice(5)}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Animal status pie chart */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-600">Animal Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={animalStatusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                (percent ?? 0) > 0.04 ? `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%` : ''
              }
            >
              {animalStatusData.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
