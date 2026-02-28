'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Heart,
  Shield,
  MapPin,
  Users,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react'

interface FloatingItem {
  icon: React.ReactNode
  iconBg: string
  line1: string
  line2: string
  live?: boolean // show pulsing green dot
}

const topLeftItems: FloatingItem[] = [
  {
    icon: <Activity className="h-5 w-5 text-primary" />,
    iconBg: 'bg-primary/10',
    line1: 'Live Rescues',
    line2: '24/7 real-time tracking',
    live: true,
  },
  {
    icon: <Shield className="h-5 w-5 text-blue-600" />,
    iconBg: 'bg-blue-50',
    line1: '128 NGOs Active',
    line2: 'Verified rescue partners',
  },
  {
    icon: <Zap className="h-5 w-5 text-amber-500" />,
    iconBg: 'bg-amber-50',
    line1: 'AI Triage < 3s',
    line2: 'Instant urgency scoring',
    live: true,
  },
  {
    icon: <Clock className="h-5 w-5 text-violet-600" />,
    iconBg: 'bg-violet-50',
    line1: 'Avg Response 12min',
    line2: 'Fastest in the country',
  },
]

const bottomRightItems: FloatingItem[] = [
  {
    icon: <Heart className="h-5 w-5 text-red-500" fill="currentColor" />,
    iconBg: 'bg-red-50',
    line1: '5,200+',
    line2: 'Animals saved this year',
  },
  {
    icon: <MapPin className="h-5 w-5 text-primary" />,
    iconBg: 'bg-primary/10',
    line1: '42 Cities',
    line2: 'Pan-India coverage',
  },
  {
    icon: <Users className="h-5 w-5 text-sky-600" />,
    iconBg: 'bg-sky-50',
    line1: '18,000+',
    line2: 'Citizen reporters',
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
    iconBg: 'bg-emerald-50',
    line1: '93% Survival',
    line2: 'Post-rescue recovery rate',
  },
]

/** A single floating card that cycles through items with a blur-dissolve transition */
function CyclingCard({
  items,
  interval = 3500,
  className,
}: {
  items: FloatingItem[]
  interval?: number
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      // Phase 1: blur out
      setVisible(false)

      // Phase 2: swap data + fade in
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length)
        setVisible(true)
      }, 500) // matches the CSS transition duration
    }, interval)

    return () => clearInterval(timer)
  }, [items.length, interval])

  const item = items[index]

  return (
    <div className={className}>
      <div
        className={`bg-white/90 backdrop-blur-md rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 border border-gray-100/80 transition-all duration-500 ease-in-out ${
          visible
            ? 'opacity-100 blur-0 scale-100'
            : 'opacity-0 blur-md scale-95'
        }`}
      >
        <div
          className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center shrink-0`}
        >
          {item.icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {item.line1}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{item.line2}</p>
        </div>
        {item.live && (
          <span className="relative flex h-2.5 w-2.5 ml-1 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
        )}
      </div>
    </div>
  )
}

/** Both floating hero overlay cards — drop this into the hero image container */
export default function HeroFloatingCards() {
  return (
    <>
      {/* Top-Left */}
      <CyclingCard
        items={topLeftItems}
        interval={3500}
        className="absolute -top-4 -left-6 z-10 animate-[float_5s_ease-in-out_infinite]"
      />

      {/* Bottom-Right */}
      <CyclingCard
        items={bottomRightItems}
        interval={4200}
        className="absolute -bottom-4 -right-6 z-10 animate-[float_6s_ease-in-out_1s_infinite]"
      />
    </>
  )
}
