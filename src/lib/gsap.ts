'use client'
// Single registration point for GSAP plugins.
// Import from here instead of 'gsap' directly to ensure plugins are registered.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }
