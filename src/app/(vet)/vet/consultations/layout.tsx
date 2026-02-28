import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import VetSidebar from '@/components/layout/vet-sidebar'
import NotificationsBell from '@/components/layout/notifications-bell'
import UserMenu from '@/components/layout/user-menu'

export default async function VetConsultationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user as { id: string; role: string; name?: string } | undefined

  if (!session?.user || user?.role !== 'VETERINARIAN') {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VetSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-3 border-b bg-white px-6 py-3">
          <NotificationsBell />
          {user && <UserMenu user={user} />}
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
