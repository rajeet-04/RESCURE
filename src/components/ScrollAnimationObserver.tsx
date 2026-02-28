'use client'

import { useEffect } from 'react'

/**
 * Registers an IntersectionObserver that adds the `animate-in` class to matching scroll-animation elements when they enter the viewport.
 *
 * Observes elements with the classes: `.scroll-animate`, `.scroll-slide-up`, `.scroll-slide-left`, `.scroll-slide-right`, `.scroll-zoom-in`, `.scroll-blur`, and `.scroll-fade`, and disconnects observation on unmount.
 *
 * @returns null — the component renders nothing
 */
export function ScrollAnimationObserver() {
  useEffect(() => {
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
      '.scroll-animate, .scroll-slide-up, .scroll-slide-left, .scroll-slide-right, .scroll-zoom-in, .scroll-blur, .scroll-fade'
    )

    animatedElements.forEach((el) => observer.observe(el))

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return null
}
