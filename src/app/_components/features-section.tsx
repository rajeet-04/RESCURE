'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle, Activity, Shield, Heart, MapPin, TrendingUp } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { gsap, ScrollTrigger } from '@/lib/gsap'

const iconMap: Record<string, React.ReactNode> = {
  alert: <AlertCircle className="h-7 w-7 text-primary" />,
  activity: <Activity className="h-7 w-7 text-primary" />,
  shield: <Shield className="h-7 w-7 text-primary" />,
  heart: <Heart className="h-7 w-7 text-primary" />,
  map: <MapPin className="h-7 w-7 text-primary" />,
  trending: <TrendingUp className="h-7 w-7 text-primary" />,
}

interface Feature {
  icon: string
  title: string
  desc: string
}

interface FeaturesSectionProps {
  features: Feature[]
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll<HTMLElement>('.feature-card')
      if (!cards || cards.length === 0) return

      // Set initial hidden state
      gsap.set(cards, { opacity: 0, y: 40 })

      ScrollTrigger.batch(cards, {
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            stagger: 0.1,
          }),
        start: 'top 88%',
        once: true,
      })
    }, gridRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn direction="up" duration={0.6}>
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">PLATFORM FEATURES</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Built for Rescue Teams</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed to maximize rescue efficiency and animal welfare
            </p>
          </div>
        </FadeIn>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="feature-card bg-gray-50 rounded-2xl p-8 hover:bg-primary/5 hover:shadow-md transition-all group border border-transparent hover:border-primary/20"
            >
              <div className="flex justify-center mb-5">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
                  {iconMap[f.icon] ?? <Activity className="h-7 w-7 text-primary" />}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-3 text-center">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed text-center">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
