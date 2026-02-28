import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import NGOSidebar from '@/components/layout/ngo-sidebar'

export default async function NGODashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!session?.user || (role !== 'NGO_ADMIN' && role !== 'NGO_WORKER')) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NGOSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
