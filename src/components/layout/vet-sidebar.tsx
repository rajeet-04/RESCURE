'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/vet/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vet/consultations', label: 'Consultations', icon: MessageSquare },
]

interface SidebarContentProps {
  pathname: string
  setMobileOpen: (open: boolean) => void
}

function SidebarContent({ pathname, setMobileOpen }: SidebarContentProps) {
  const isActive = (href: string) =>
    href === '/vet/dashboard'
      ? pathname === '/vet/dashboard'
      : pathname.startsWith(href)

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold tracking-tight text-primary">RESCURE</span>
        <button
          aria-label="Close sidebar"
          className="lg:hidden text-gray-400 hover:text-gray-600"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role label */}
      <div className="px-6 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          🩺 Veterinarian
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${isActive(href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-6 py-4">
        <p className="text-xs text-muted-foreground">© 2024 RESCURE</p>
      </div>
    </div>
  )
}

export default function VetSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        aria-label="Open navigation menu"
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <SidebarContent pathname={pathname} setMobileOpen={setMobileOpen} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
        <SidebarContent pathname={pathname} setMobileOpen={setMobileOpen} />
      </aside>
    </>
  )
}
