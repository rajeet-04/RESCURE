'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ScrollRevealProps {
  children: ReactNode
  /** Extra Tailwind classes on the wrapper */
  className?: string
  /** Delay in ms before the animation starts — use for staggering siblings */
  delay?: number
  /** y-offset to slide up from (px). Defaults to 32 */
  yOffset?: number
}

/**
 * Reveals children with a blur → clear + fade-in + slide-up effect
 * driven by Framer Motion's whileInView.  Triggers once per mount.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  yOffset = 32,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: 'blur(14px)', y: yOffset }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.75,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
