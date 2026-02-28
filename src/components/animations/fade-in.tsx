'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: Direction
  amount?: number
  once?: boolean
  className?: string
}

const directionOffset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  amount = 0.15,
  once = true,
  className,
}: FadeInProps) {
  const offset = directionOffset[direction]

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
