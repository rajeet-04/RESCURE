import { prisma } from '@/lib/prisma'
import { Heart, MapPin, Building2 } from 'lucide-react'

/**
 * Render a responsive grid of three community statistics cards.
 *
 * Fetches counts for rescued cases, incident reports, and verified NGOs, formats each count with locale-aware separators, and displays them with an associated icon and label.
 *
 * @returns A React element containing a responsive grid of three statistic cards, each showing an icon, a formatted numeric value, and a descriptive label.
 */
export default async function CommunityStats() {
  const [totalRescued, totalReports, activeNGOs] = await Promise.all([
    prisma.rescueCase.count({ where: { state: 'RESCUED' } }),
    prisma.incidentReport.count(),
    prisma.nGO.count({ where: { verified: true } }),
  ])

  const stats = [
    { Icon: Heart, label: 'Animals Rescued', value: totalRescued.toLocaleString() },
    { Icon: MapPin, label: 'Reports Submitted', value: totalReports.toLocaleString() },
    { Icon: Building2, label: 'Active NGOs', value: activeNGOs.toLocaleString() },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 hover:border-green-200 transition-all flex items-center gap-4 animate-scale-in"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <s.Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
