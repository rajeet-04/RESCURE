'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

interface CityData {
  city: string
  totalCases: number
  resolvedCases: number
  activeNGOs: number
  averageResponseTime: number
}

interface CityChartProps {
  data: CityData[]
}

export default function CityChart({ data }: CityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
        <XAxis
          dataKey="city"
          angle={-35}
          textAnchor="end"
          tick={{ fontSize: 12 }}
          interval={0}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend verticalAlign="top" />
        <Bar dataKey="totalCases" name="Total Cases" fill="#f97316" radius={[4, 4, 0, 0]} />
        <Bar dataKey="resolvedCases" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
