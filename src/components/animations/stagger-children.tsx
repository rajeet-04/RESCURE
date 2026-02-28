'use client'

import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

interface StaggerChildrenProps {
  children: ReactNode
  staggerDelay?: number
  delay?: number
  className?: string
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

const containerVariants = (staggerDelay: number, delay: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: delay,
    },
  },
})

const childVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export function StaggerChildren({
  children,
  staggerDelay = 0.12,
  delay = 0,
  className,
}: StaggerChildrenProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants(staggerDelay, delay)}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={childVariants}>
      {children}
    </motion.div>
  )
}
