import { useEffect, useRef } from 'react'

interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/**
 * Attaches an IntersectionObserver to a ref so a DOM element receives the `animate-in` class when it enters the viewport.
 *
 * @param options - Configuration for the observer:
 *   - `threshold`: intersection ratio that triggers the animation (default `0.1`).
 *   - `rootMargin`: offsets applied to the root bounding box (default `'0px 0px -100px 0px'`).
 *   - `triggerOnce`: if `true`, the element is unobserved after the first intersection; if `false`, the `animate-in` class is removed when the element exits (default `true`).
 * @returns A `RefObject<HTMLDivElement>` to attach to the element to be animated
 */
export function useScrollAnimation(
  options: ScrollAnimationOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true
  } = options

  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            if (triggerOnce) {
              observer.unobserve(entry.target)
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove('animate-in')
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [threshold, rootMargin, triggerOnce])

  return elementRef
}
