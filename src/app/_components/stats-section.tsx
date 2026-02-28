'use client'

import { Activity, Heart, Building2, Users } from 'lucide-react'
import { FadeIn, CountUp } from '@/components/animations'

interface Stat {
  label: string
  rawValue: number
  suffix?: string
  icon: string
}

interface StatsSectionProps {
  stats: Stat[]
}

const iconMap: Record<string, React.ReactNode> = {
  clipboard: <Activity className="h-6 w-6 text-primary" />,
  heart: <Heart className="h-6 w-6 text-primary" />,
  building: <Building2 className="h-6 w-6 text-primary" />,
  users: <Users className="h-6 w-6 text-primary" />,
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} direction="up" duration={0.55}>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  {iconMap[stat.icon] ?? null}
                </div>
                <CountUp
                  to={stat.rawValue}
                  suffix={stat.suffix}
                  className="text-4xl font-bold text-gray-900"
                />
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
