'use client'

import { motion } from 'framer-motion'

type HeadingTag = 'h1' | 'h2' | 'h3' | 'p'

interface TextRevealProps {
  text: string
  as?: HeadingTag
  delay?: number
  staggerDelay?: number
  className?: string
}

export function TextReveal({
  text,
  as: Tag = 'p',
  delay = 0,
  staggerDelay = 0.05,
  className,
}: TextRevealProps) {
  const words = text.split(' ')

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={i} className="clip-text inline-block">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              duration: 0.5,
              delay: delay + i * staggerDelay,
              ease: [0.33, 1, 0.68, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? '\u00A0' : null}
        </span>
      ))}
    </Tag>
  )
}
