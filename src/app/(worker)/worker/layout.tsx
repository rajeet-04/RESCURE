import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Home, Briefcase, Map, User } from 'lucide-react'

const GpsTracker = dynamic(
  () => import('@/components/worker/gps-tracker'),
  { ssr: false }
)

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user as { id: string; role: string; name?: string } | undefined

  if (!user || user.role !== 'NGO_WORKER') {
    redirect('/unauthorized')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white border-b px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-orange-600">RESCURE</h1>
        <div className="flex items-center gap-3">
          <GpsTracker />
          {user.name && (
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/worker/dashboard"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600 px-4 py-1"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/worker/dashboard"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600 px-4 py-1"
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xs">Cases</span>
          </Link>
          <Link
            href="/worker/map"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600 px-4 py-1"
          >
            <Map className="h-5 w-5" />
            <span className="text-xs">Map</span>
          </Link>
          <Link
            href="/worker/dashboard"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600 px-4 py-1"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
