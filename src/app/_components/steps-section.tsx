'use client'

import { Smartphone, Truck, Heart, MapPin, AlertCircle, Activity, Shield, TrendingUp } from 'lucide-react'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations'

const iconMap: Record<string, React.ReactNode> = {
  smartphone: <Smartphone className="h-10 w-10 text-primary" />,
  truck: <Truck className="h-10 w-10 text-primary" />,
  heart: <Heart className="h-10 w-10 text-primary" />,
  map: <MapPin className="h-10 w-10 text-primary" />,
  alert: <AlertCircle className="h-10 w-10 text-primary" />,
  activity: <Activity className="h-10 w-10 text-primary" />,
  shield: <Shield className="h-10 w-10 text-primary" />,
  trending: <TrendingUp className="h-10 w-10 text-primary" />,
}

interface Step {
  step: string
  icon: string
  title: string
  desc: string
}

interface StepsSectionProps {
  steps: Step[]
}

export function StepsSection({ steps }: StepsSectionProps) {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <FadeIn direction="up" duration={0.6}>
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">HOW IT WORKS</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Three Steps to Save a Life</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our streamlined process ensures every reported animal gets immediate attention
            </p>
          </div>
        </FadeIn>

        <StaggerChildren staggerDelay={0.15}>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <StaggerItem key={s.step}>
                <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all group">
                  <div className="absolute -top-5 left-8 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {i + 1}
                  </div>
                  <div className="flex justify-center mb-6 pt-2">
                    <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                      {iconMap[s.icon] ?? <Heart className="h-10 w-10 text-primary" />}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-3 text-center">{s.title}</h3>
                  <p className="text-gray-600 text-center leading-relaxed">{s.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerChildren>
      </div>
    </section>
  )
}
