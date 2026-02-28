'use client'

import { useEffect } from 'react'

export function ScrollAnimationObserver() {
  useEffect(() => {
    // Intersection Observer for reveal animations
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -80px 0px'
    })

    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll(
      '.scroll-animate, .scroll-slide-up, .scroll-slide-left, .scroll-slide-right, .scroll-zoom-in, .scroll-blur, .scroll-fade, .scroll-reveal, .scroll-slide-rotate, .scroll-flip'
    )

    animatedElements.forEach((el) => observer.observe(el))

    // Parallax scroll effect
    const handleParallax = () => {
      const scrolled = window.pageYOffset
      
      // Apply parallax to elements with parallax classes
      const parallaxSlow = document.querySelectorAll('.parallax-slow')
      parallaxSlow.forEach((el) => {
        const speed = 0.3
        const rect = el.getBoundingClientRect()
        const offset = rect.top + scrolled
        const yPos = -(scrolled - offset) * speed
        ;(el as HTMLElement).style.transform = `translateY(${yPos}px)`
      })
      
      const parallaxMedium = document.querySelectorAll('.parallax-medium')
      parallaxMedium.forEach((el) => {
        const speed = 0.5
        const rect = el.getBoundingClientRect()
        const offset = rect.top + scrolled
        const yPos = -(scrolled - offset) * speed
        ;(el as HTMLElement).style.transform = `translateY(${yPos}px)`
      })
      
      const parallaxFast = document.querySelectorAll('.parallax-fast')
      parallaxFast.forEach((el) => {
        const speed = 0.7
        const rect = el.getBoundingClientRect()
        const offset = rect.top + scrolled
        const yPos = -(scrolled - offset) * speed
        ;(el as HTMLElement).style.transform = `translateY(${yPos}px)`
      })
    }

    // Throttle parallax for performance
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleParallax()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el))
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return null
}
