'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Heart, Activity, Building2 } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { SiteHeader } from './site-header'

interface HeroSectionProps {
  user: {
    id: string | null
    name: string | null
    image: string | null
    role: string | null
  } | null
}

export function HeroSection({ user }: HeroSectionProps) {
  const mainCardRef = useRef<HTMLDivElement>(null)
  const leftCardRef = useRef<HTMLDivElement>(null)
  const rightCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ctx = gsap.context(() => {
      // Main card — subtle scale-in on scroll
      gsap.from(mainCardRef.current, {
        scale: 0.92,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: mainCardRef.current,
          start: 'top 90%',
          once: true,
        },
      })
      // Left card — moves UP as user scrolls
      gsap.to(leftCardRef.current, {
        yPercent: -18,
        ease: 'none',
        scrollTrigger: {
          trigger: mainCardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      })
      // Right card — moves DOWN as user scrolls
      gsap.to(rightCardRef.current, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: mainCardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      {/* ── Header (scroll-shrink effect via GSAP) ── */}
      <SiteHeader user={user} />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content — Framer Motion cascade */}
            <div className="text-left space-y-8">
              {/* Badge */}
              <FadeIn delay={0} direction="up" duration={0.5}>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2.5 rounded-full border border-primary/20">
                  <Heart className="h-4 w-4" fill="currentColor" />
                  TRUSTED RESCUE FOR EVERY ANIMAL
                </div>
              </FadeIn>

              {/* Main Heading */}
              <FadeIn delay={0.15} direction="up" duration={0.55}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
                  Expert Rescue for
                  <span className="block mt-2">Strays and Injured Animals</span>
                </h1>
              </FadeIn>

              {/* Subtitle */}
              <FadeIn delay={0.35} direction="up" duration={0.5}>
                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                  From emergency reporting and AI triage to vet care and adoption, we&apos;re here to help every animal get the care they need, every day.
                </p>
              </FadeIn>

              {/* CTA Buttons */}
              <FadeIn delay={0.5} direction="up" duration={0.5}>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link
                    href="/report"
                    className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white text-base font-bold px-8 py-4 rounded-full hover:bg-gray-800 transition-all shadow-md hover:shadow-lg group"
                  >
                    REPORT EMERGENCY
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:translate-x-1 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    href="/adopt"
                    className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 text-base font-bold px-8 py-4 rounded-full border-2 border-gray-900 hover:bg-gray-50 transition-all group"
                  >
                    EXPLORE SERVICES
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full group-hover:translate-x-1 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right - Hero Images with GSAP parallax */}
            <div className="relative lg:block hidden">
              <div className="relative">
                {/* Main large image */}
                <div
                  ref={mainCardRef}
                  className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-green-600/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Heart className="h-24 w-24 text-primary mx-auto" strokeWidth={1.5} />
                      <p className="text-2xl font-bold text-gray-700">Rescue in Action</p>
                      <p className="text-gray-500 max-w-xs mx-auto">Real-time emergency response for stray and injured animals</p>
                    </div>
                  </div>
                </div>

                {/* Left parallax card — drifts UP on scroll */}
                <div
                  ref={leftCardRef}
                  className="absolute -left-12 top-20 w-48 h-56 bg-white rounded-2xl shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-500 overflow-hidden opacity-80"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="h-16 w-16 text-primary" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Right parallax card — drifts DOWN on scroll */}
                <div
                  ref={rightCardRef}
                  className="absolute -right-12 bottom-20 w-48 h-56 bg-white rounded-2xl shadow-xl transform rotate-12 hover:rotate-0 transition-transform duration-500 overflow-hidden opacity-80"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
