'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Layers,
  Map,
  Users,
  BarChart3,
  ShoppingBag,
  Stethoscope,
  Settings,
  Bell,
  Menu,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NGOSidebarProps {
  notificationCount?: number
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/cases', label: 'Cases', icon: Layers },
  { href: '/dashboard/map', label: 'Map', icon: Map },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/dashboard/book-vet', label: 'Book a Vet', icon: Stethoscope },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function NGOSidebar({ notificationCount = 0 }: NGOSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="RESCURE" width={36} height={36} className="rounded-full" />
          <span className="text-xl font-bold tracking-tight text-primary">RESCURE</span>
        </div>
        <button
          className="lg:hidden text-gray-400 hover:text-gray-600"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Notification Banner */}
      {notificationCount > 0 && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 border border-green-100">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground font-semibold">
            {notificationCount} new alert{notificationCount > 1 ? 's' : ''}
          </span>
          <Badge className="ml-auto bg-primary text-primary-foreground text-xs">{notificationCount}</Badge>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
              isActive(href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
            {label === 'Cases' && notificationCount > 0 && (
              <Badge className="ml-auto bg-primary text-primary-foreground text-xs">{notificationCount}</Badge>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-6 py-4">
        <p className="text-xs text-muted-foreground">© 2024 RESCURE</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden border border-gray-200"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5 text-primary" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
        <SidebarContent />
      </aside>
    </>
  )
}
