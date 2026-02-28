import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import NGOSidebar from '@/components/layout/ngo-sidebar'
import NotificationsBell from '@/components/layout/notifications-bell'

export default async function NGODashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user as { id: string; role: string; name?: string } | undefined
  const role = user?.role

  if (!session?.user || (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER')) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NGOSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-3 border-b bg-white px-6 py-3">
          <NotificationsBell />
          {user?.name && (
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
