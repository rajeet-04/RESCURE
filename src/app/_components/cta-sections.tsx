'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Building2, Smartphone, MapPin, Truck } from 'lucide-react'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations'
import { gsap, ScrollTrigger } from '@/lib/gsap'

export function NGOCTASection() {
  const topCircleRef = useRef<HTMLDivElement>(null)
  const bottomCircleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ctx = gsap.context(() => {
      const section = topCircleRef.current?.closest('section')
      if (!section) return
      gsap.to(topCircleRef.current, {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      })
      gsap.to(bottomCircleRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <FadeIn direction="up" duration={0.7}>
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-primary rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            {/* Parallax decorative circles */}
            <div
              ref={topCircleRef}
              className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"
            />
            <div
              ref={bottomCircleRef}
              className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"
            />
            <FadeIn direction="up" delay={0.2}>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">Partner With Us</h2>
                <p className="text-white/90 mb-4 max-w-2xl mx-auto text-lg leading-relaxed">
                  Get a free rescue management dashboard, real-time incident alerts, verified vet network, and discounted supplier access.
                </p>
                <p className="text-sm text-white/70 mb-10">Free tier available · Pro and Enterprise plans for growing teams</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/register?role=ngo"
                    className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all shadow-lg group"
                  >
                    Join Free
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full group-hover:translate-x-1 transition-transform">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    href="/api-docs#pricing"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-10 py-4 rounded-full border-2 border-white/30 hover:bg-white/20 transition-all group backdrop-blur-sm"
                  >
                    View Pricing
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-white/10 rounded-full group-hover:translate-x-1 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </FadeIn>
  )
}

export function CitizensCTASection() {
  const miniSteps = [
    { icon: <Smartphone className="h-10 w-10 text-primary" />, label: 'Take a photo' },
    { icon: <MapPin className="h-10 w-10 text-primary" />, label: 'Share location' },
    { icon: <Truck className="h-10 w-10 text-primary" />, label: 'Help dispatched' },
  ]

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <FadeIn direction="up" duration={0.6}>
          <div>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">FOR CITIZENS</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Every Report Saves a Life</h2>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
              Spotted an injured animal? Report in under 60 seconds. Your location, photo, and description instantly routes help.
            </p>
          </div>
        </FadeIn>

        <StaggerChildren staggerDelay={0.12} className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
          {miniSteps.map((s) => (
            <StaggerItem key={s.label}>
              <div className="bg-gray-50 rounded-2xl p-8 hover:bg-primary/5 hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                <div className="flex justify-center mb-4">{s.icon}</div>
                <div className="font-bold text-gray-900 text-lg">{s.label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <FadeIn direction="up" delay={0.35}>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold px-10 py-4 rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] group"
          >
            REPORT NOW
            <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:translate-x-1 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}
