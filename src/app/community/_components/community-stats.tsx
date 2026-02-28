import { prisma } from '@/lib/prisma'
import { Heart, MapPin, Building2 } from 'lucide-react'

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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all animate-scale-in"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <s.Icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-sm font-medium text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
