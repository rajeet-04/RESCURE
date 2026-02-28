'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

interface CountUpProps {
  to: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  separator?: boolean
}

export function CountUp({
  to,
  duration = 1.5,
  className,
  prefix = '',
  suffix = '',
  separator = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: to,
        duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
        onUpdate() {
          el.textContent =
            prefix +
            (separator
              ? Math.round(obj.val).toLocaleString('en-IN')
              : Math.round(obj.val).toString()) +
            suffix
        },
      })
    })

    return () => ctx.revert()
  }, [to, duration, prefix, suffix, separator])

  return (
    <span ref={ref} className={className}>
      0
    </span>
  )
}
