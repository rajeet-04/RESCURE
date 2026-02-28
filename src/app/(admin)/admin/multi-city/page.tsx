import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CityChart from './_components/city-chart'

interface CityData {
  city: string
  totalCases: number
  resolvedCases: number
  activeNGOs: number
  averageResponseTime: number
}

async function getMultiCityData(): Promise<CityData[]> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/analytics/multi-city`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function MultiCityPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    redirect('/unauthorized')
  }

  const cityData = await getMultiCityData()

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">🌍 Multi-City Operations</h1>

      {/* Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cases by City</CardTitle>
        </CardHeader>
        <CardContent>
          <CityChart data={cityData} />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>City Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">City</th>
                <th className="pb-2 pr-4 font-medium">Total Cases</th>
                <th className="pb-2 pr-4 font-medium">Resolved</th>
                <th className="pb-2 pr-4 font-medium">Active NGOs</th>
                <th className="pb-2 font-medium">Avg Response (min)</th>
              </tr>
            </thead>
            <tbody>
              {cityData.map((row) => (
                <tr key={row.city} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{row.city}</td>
                  <td className="py-2 pr-4 font-bold text-orange-600">{row.totalCases}</td>
                  <td className="py-2 pr-4 text-green-600">{row.resolvedCases}</td>
                  <td className="py-2 pr-4">{row.activeNGOs}</td>
                  <td className="py-2">{row.averageResponseTime} min</td>
                </tr>
              ))}
              {cityData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No city data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
