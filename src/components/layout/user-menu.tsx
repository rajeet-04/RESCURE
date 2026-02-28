'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface UserMenuProps {
  user: {
    name?: string | null
    image?: string | null
    role?: string | null
    id?: string | null
  }
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

  const dashboardLink = (() => {
    switch (user.role) {
      case 'NGO_ADMIN':
      case 'NGO_WORKER':
        return { href: '/dashboard', label: '🏥 NGO Dashboard' }
      case 'VETERINARIAN':
        return { href: '/vet/dashboard', label: '🩺 Vet Dashboard' }
      case 'SUPPLIER':
        return { href: '/supplier/dashboard', label: '🏪 Supplier Dashboard' }
      case 'PLATFORM_ADMIN':
        return { href: '/admin/dashboard', label: '⚙️ Admin Panel' }
      default:
        return { href: '/report', label: '👤 My Account' }
    }
  })()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 focus:outline-none"
        aria-label="User menu"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? 'User'}
            className="w-9 h-9 rounded-full border-2 border-orange-300 object-cover"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm border-2 border-orange-300">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[110px] truncate">
          {user.name ?? 'My Account'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">My Account</p>
          </div>

          <Link
            href={dashboardLink.href}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {dashboardLink.label}
          </Link>

          <Link
            href="/report/history"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📋 My Reports
          </Link>

          {(user.role === 'CITIZEN' || user.role === 'SPONSOR' || !user.role) && (
            <Link
              href="/sponsor/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              💙 My Sponsorships
            </Link>
          )}

          <div className="border-t border-gray-100 my-1" />

          <Link
            href="/report"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            🚨 Report Animal
          </Link>
          <Link
            href="/adopt"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            🐾 Browse Animals
          </Link>
          <Link
            href="/community"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            🤝 Community
          </Link>

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
          >
            🚪 Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
