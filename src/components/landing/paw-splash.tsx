'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * Paw Splash — A soothing fullscreen intro animation.
 * Two paw SVGs slide apart from the center like paws "opening",
 * revealing the rescure wordmark + heartbeat, then the overlay
 * fades away to expose the real page beneath.
 *
 * Total duration ≈ 2.6 s  (plays once on mount, then unmounts itself).
 */
export default function PawSplash() {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'done'>(() => {
    // Skip if user prefers reduced motion (set initial state to 'done')
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'done'
    }
    return 'enter'
  })

  useEffect(() => {
    if (phase === 'done') return

    const t1 = setTimeout(() => setPhase('hold'), 800)   // paws finish opening
    const t2 = setTimeout(() => setPhase('exit'), 2000)   // start fade-out
    const t3 = setTimeout(() => setPhase('done'), 2600)   // unmount

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-[600ms] ease-out ${phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      {/* Gentle radial glow behind the logo */}
      <div className="absolute w-[420px] h-[420px] rounded-full bg-gradient-radial from-green-100/70 via-green-50/30 to-transparent animate-[breathe_3s_ease-in-out_infinite] blur-2xl" />

      {/* LEFT PAW — slides left */}
      <div
        className={`absolute transition-all duration-[800ms] ease-[cubic-bezier(.4,0,.2,1)] ${phase === 'enter'
          ? 'translate-x-0 opacity-100'
          : '-translate-x-[140px] sm:-translate-x-[180px] opacity-40'
          }`}
      >
        <PawSVG className="w-20 h-20 sm:w-28 sm:h-28 text-primary/80 -rotate-[25deg]" />
      </div>

      {/* RIGHT PAW — slides right */}
      <div
        className={`absolute transition-all duration-[800ms] ease-[cubic-bezier(.4,0,.2,1)] ${phase === 'enter'
          ? 'translate-x-0 opacity-100'
          : 'translate-x-[140px] sm:translate-x-[180px] opacity-40'
          }`}
      >
        <PawSVG className="w-20 h-20 sm:w-28 sm:h-28 text-primary/80 rotate-[25deg] scale-x-[-1]" />
      </div>

      {/* CENTER LOGO — fades in after paws open */}
      <div
        className={`relative flex flex-col items-center gap-3 transition-all duration-700 ease-out ${phase === 'enter'
          ? 'opacity-0 scale-90'
          : 'opacity-100 scale-100'
          }`}
      >
        {/* Logo with pulse ring */}
        <div className="relative">
          <Image src="/logo.png" alt="RESCURE" width={64} height={64} className="rounded-full shadow-lg shadow-primary/25" />
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-[ping-slow_1.8s_ease-out_infinite]" />
        </div>

        {/* Wordmark */}
        <span className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          rescure
        </span>
        <span className="text-xs sm:text-sm font-medium text-gray-400 tracking-[0.25em] uppercase">
          every life matters
        </span>
      </div>
    </div>
  )
}

/* ─── Paw SVG ─── */
function PawSVG({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main pad */}
      <ellipse cx="256" cy="360" rx="90" ry="75" />
      {/* Toe 1 — left outer */}
      <ellipse cx="140" cy="240" rx="48" ry="58" transform="rotate(-15 140 240)" />
      {/* Toe 2 — left inner */}
      <ellipse cx="210" cy="195" rx="42" ry="54" transform="rotate(-5 210 195)" />
      {/* Toe 3 — right inner */}
      <ellipse cx="302" cy="195" rx="42" ry="54" transform="rotate(5 302 195)" />
      {/* Toe 4 — right outer */}
      <ellipse cx="372" cy="240" rx="48" ry="58" transform="rotate(15 372 240)" />
    </svg>
  )
}
