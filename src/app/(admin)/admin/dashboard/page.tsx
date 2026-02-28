import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NGOVerifyButton from './_components/ngo-verify-button'

export default async function AdminDashboardPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string; name?: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    redirect('/unauthorized')
  }

  const [ngos, totalReports, activeReports, animalsInCare, animalsReleased, totalUsers] =
    await Promise.all([
      prisma.nGO.findMany({
        include: { _count: { select: { rescueCases: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.incidentReport.count(),
      prisma.incidentReport.count({ where: { status: { not: 'CLOSED' } } }),
      prisma.animal.count({ where: { status: 'IN_TREATMENT' } }),
      prisma.animal.count({ where: { status: 'RELEASED' } }),
      prisma.user.count(),
    ])

  const recentReports = await prisma.incidentReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, address: true, urgencyScore: true, status: true, createdAt: true },
  })

  const urgencyColors: Record<string, string> = {
    CRITICAL: 'destructive',
    HIGH: 'default',
    MEDIUM: 'secondary',
    LOW: 'outline',
  }

  const statusColors: Record<string, string> = {
    PENDING: 'secondary',
    ASSIGNED: 'default',
    EN_ROUTE: 'default',
    RESCUED: 'default',
    IN_CARE: 'default',
    RELEASED: 'outline',
    CLOSED: 'outline',
    DUPLICATE: 'secondary',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Platform Admin Dashboard</h1>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{activeReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Animals In Care</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{animalsInCare}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Released</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{animalsReleased}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* NGO Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>NGOs ({ngos.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">City</th>
                <th className="pb-2 pr-4 font-medium">Tier</th>
                <th className="pb-2 pr-4 font-medium">Verified</th>
                <th className="pb-2 pr-4 font-medium">Cases</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {ngos.map((ngo) => (
                <tr key={ngo.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{ngo.name}</td>
                  <td className="py-2 pr-4 text-gray-500">{ngo.city ?? '—'}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={ngo.tier === 'FREE' ? 'secondary' : ngo.tier === 'PRO' ? 'default' : 'outline'}>
                      {ngo.tier}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    {ngo.verified ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">✓ Verified</Badge>
                    ) : (
                      <Badge variant="secondary">Unverified</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-4">{ngo._count.rescueCases}</td>
                  <td className="py-2">
                    <NGOVerifyButton ngoId={ngo.id} currentVerified={ngo.verified} />
                  </td>
                </tr>
              ))}
              {ngos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">No NGOs registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent 10 Incident Reports</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">ID</th>
                <th className="pb-2 pr-4 font-medium">Address</th>
                <th className="pb-2 pr-4 font-medium">Urgency</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-500">
                    {report.id.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{report.address ?? 'Unknown'}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={(urgencyColors[report.urgencyScore] as 'destructive' | 'default' | 'secondary' | 'outline') ?? 'secondary'}>
                      {report.urgencyScore}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={(statusColors[report.status] as 'default' | 'secondary' | 'outline') ?? 'secondary'}>
                      {report.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">No reports yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
