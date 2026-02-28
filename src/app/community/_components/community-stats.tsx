import { prisma } from '@/lib/prisma'

export default async function CommunityStats() {
  const [totalRescued, totalReports, activeNGOs] = await Promise.all([
    prisma.rescueCase.count({ where: { state: 'RESCUED' } }),
    prisma.incidentReport.count(),
    prisma.nGO.count({ where: { verified: true } }),
  ])

  const stats = [
    { icon: '🐾', label: 'Animals Rescued', value: totalRescued.toLocaleString() },
    { icon: '📍', label: 'Reports Submitted', value: totalReports.toLocaleString() },
    { icon: '🏥', label: 'Active NGOs', value: activeNGOs.toLocaleString() },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 flex items-center gap-4"
        >
          <span className="text-4xl">{s.icon}</span>
          <div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
