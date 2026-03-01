'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  ClipboardList,
  Heart,
  AlertTriangle,
  PawPrint,
  Users,
  ChevronDown,
  LogOut,
  Stethoscope,
  ShieldCheck,
  Store,
} from 'lucide-react'

interface UserMenuProps {
  user: {
    name?: string | null
    image?: string | null
    role?: string | null
    id?: string | null
  }
}

const ROLE_LABELS: Record<string, string> = {
  NGO_ADMIN: 'NGO Admin',
  NGO_WORKER: 'NGO Worker',
  VETERINARIAN: 'Veterinarian',
  SUPPLIER: 'Supplier',
  PLATFORM_ADMIN: 'Admin',
  CITIZEN: 'Citizen',
  SPONSOR: 'Sponsor',
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initial = user.name?.charAt(0)?.toUpperCase() ?? '?'
  const roleLabel = user.role ? (ROLE_LABELS[user.role] ?? user.role) : null

  const dashboardLink = (() => {
    switch (user.role) {
      case 'NGO_ADMIN':
      case 'NGO_WORKER':
        return { href: '/dashboard', label: 'NGO Dashboard', icon: LayoutDashboard }
      case 'VETERINARIAN':
        return { href: '/vet/dashboard', label: 'Vet Dashboard', icon: Stethoscope }
      case 'SUPPLIER':
        return { href: '/supplier/dashboard', label: 'Supplier Dashboard', icon: Store }
      case 'PLATFORM_ADMIN':
        return { href: '/admin/dashboard', label: 'Admin Panel', icon: ShieldCheck }
      default:
        return { href: '/report', label: 'My Account', icon: LayoutDashboard }
    }
  })()

  const DashIcon = dashboardLink.icon

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-200 focus:outline-none
          ${isOpen
            ? 'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10'
            : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5'
          }`}
        aria-label="User menu"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? 'User'}
            className="w-7 h-7 rounded-full ring-2 ring-primary/20 object-cover shrink-0"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline text-sm font-semibold text-gray-800 max-w-[100px] truncate">
          {user.name ?? 'My Account'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Dropdown panel ── */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Glass card */}
          <div className="rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-md shadow-xl shadow-gray-200/60 overflow-hidden">

            {/* Header — user identity */}
            <div className="px-4 py-4 bg-gradient-to-br from-primary/8 to-primary/3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? 'User'}
                    className="w-10 h-10 rounded-full ring-2 ring-primary/25 object-cover shrink-0"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center font-bold text-sm ring-2 ring-primary/25 shrink-0">
                    {initial}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name ?? 'Account'}</p>
                  {roleLabel && (
                    <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {roleLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Primary action */}
            <div className="px-2 pt-2">
              <Link
                href={dashboardLink.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-primary/8 hover:text-primary transition-colors group"
              >
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <DashIcon className="w-3.5 h-3.5" />
                </span>
                {dashboardLink.label}
              </Link>

              <Link
                href="/report/history"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/8 hover:text-primary transition-colors group"
              >
                <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <ClipboardList className="w-3.5 h-3.5" />
                </span>
                My Reports
              </Link>

              {(user.role === 'CITIZEN' || user.role === 'SPONSOR' || !user.role) && (
                <Link
                  href="/sponsor/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/8 hover:text-primary transition-colors group"
                >
                  <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                  </span>
                  My Sponsorships
                </Link>
              )}
            </div>

            {/* Divider */}
            <div className="mx-3 my-1.5 border-t border-gray-100" />

            {/* Quick links */}
            <div className="px-2 pb-2">
              <p className="px-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Links</p>

              <Link
                href="/report"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors group"
              >
                <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-400 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
                Report Animal
              </Link>

              <Link
                href="/adopt"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/8 hover:text-primary transition-colors group"
              >
                <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <PawPrint className="w-3.5 h-3.5" />
                </span>
                Browse Animals
              </Link>

              <Link
                href="/community"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/8 hover:text-primary transition-colors group"
              >
                <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Users className="w-3.5 h-3.5" />
                </span>
                Community
              </Link>
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-100 p-2">
              <Link
                href="/auth/logout"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors group w-full"
              >
                <span className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </span>
                Sign Out
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
