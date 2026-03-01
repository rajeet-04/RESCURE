'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Heart, AlertCircle } from 'lucide-react'
import UserMenu from '@/components/layout/user-menu'
import { gsap, ScrollTrigger } from '@/lib/gsap'

interface SiteHeaderProps {
  user: {
    id: string | null
    name: string | null
    image: string | null
    role: string | null
  } | null
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 80,
        onUpdate: (self) => {
          if (!headerRef.current) return
          if (self.progress > 0) {
            gsap.to(headerRef.current, {
              height: 64,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              duration: 0.4,
              ease: 'power2.out',
              overwrite: 'auto',
            })
          } else {
            gsap.to(headerRef.current, {
              height: 80,
              boxShadow: 'none',
              duration: 0.4,
              ease: 'power2.out',
              overwrite: 'auto',
            })
          }
        },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-100 flex items-center"
      style={{ height: 80 }}
    >
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
            <Heart className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-2xl text-gray-900 tracking-tight">rescure</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: '/', label: 'HOME' },
            { href: '/community', label: 'COMMUNITY' },
            { href: '/adopt', label: 'ADOPT' },
            { href: '/marketplace', label: 'MARKETPLACE' },
            { href: '/api-docs', label: 'API & PRICING' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors tracking-wide"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/report"
                className="text-sm font-bold bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Report Animal
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
