import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Shared editorial-luxury motion primitives.
 *
 * Design language:
 * - Reveals: content fades + rises into place once, as it enters the viewport.
 * - Parallax: background/media drifts slower than the page for depth.
 * - Magnetic: interactive elements lean toward the cursor for a tactile feel.
 *
 * Every primitive is a no-op when the user prefers reduced motion, and uses
 * `useLayoutEffect` so the initial hidden state is set before first paint
 * (no flash of un-revealed content).
 */

let registered = false

const ensureRegistered = () => {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
    registered = true
  }
}

export const prefersReducedMotion = (): boolean => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

// SSR-safe layout effect (Vite SPA always has a window, but keep it defensive).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export interface RevealOptions {
  /** Vertical travel distance in px before settling. */
  y?: number
  /** Base animation duration in seconds. */
  duration?: number
  /** Viewport entry point that triggers the reveal. */
  start?: string
  /** Stagger between children of a `[data-reveal-group]`. */
  stagger?: number
}

/**
 * Returns a ref to attach to a section/root. Any descendant marked with
 * `data-reveal` fades + rises in on scroll. Containers marked
 * `data-reveal-group` stagger-reveal their direct children.
 *
 * Optional per-element overrides via data attributes:
 *   data-reveal-delay="0.15"   – extra delay in seconds
 *   data-reveal-y="40"         – custom travel distance
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>(options: RevealOptions = {}) => {
  const ref = useRef<T>(null)
  const {
    y = 28,
    duration = 0.9,
    start = 'top 86%',
    stagger = 0.12,
  } = options

  useIsomorphicLayoutEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion()) {
      return undefined
    }
    ensureRegistered()

    const ctx = gsap.context(() => {
      // Standalone elements (not inside a reveal group).
      const singles = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
        .filter((el) => !el.closest('[data-reveal-group]') || el.hasAttribute('data-reveal-group'))

      singles.forEach((el) => {
        const delay = Number.parseFloat(el.dataset.revealDelay || '0') || 0
        const travel = Number.parseFloat(el.dataset.revealY || '') || y
        gsap.set(el, { autoAlpha: 0, y: travel })
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start, once: true },
        })
      })

      // Grouped children stagger in together.
      const groups = gsap.utils.toArray<HTMLElement>('[data-reveal-group]', root)
      groups.forEach((group) => {
        const children = gsap.utils.toArray<HTMLElement>(':scope > *', group)
        if (children.length === 0) {
          return
        }
        gsap.set(children, { autoAlpha: 0, y })
        gsap.to(children, {
          autoAlpha: 1,
          y: 0,
          duration,
          ease: 'power3.out',
          stagger,
          scrollTrigger: { trigger: group, start, once: true },
        })
      })

      // Recalculate once async content (images, listings) has loaded.
      ScrollTrigger.refresh()
    }, root)

    return () => ctx.revert()
  }, [y, duration, start, stagger])

  return ref
}

export interface ParallaxOptions {
  /** ScrollTrigger start. Use 'top top' for elements that begin at page top. */
  start?: string
  /** ScrollTrigger end. */
  end?: string
}

/**
 * Parallax drift for hero/section media. `strength` is the fraction of the
 * element's height it travels across the scroll-through (positive = down).
 * For an element already at the top of the page, pass `{ start: 'top top' }`
 * so there is zero offset on load and it only drifts as you scroll away.
 */
export const useParallax = <T extends HTMLElement = HTMLDivElement>(
  strength = 0.18,
  options: ParallaxOptions = {},
) => {
  const ref = useRef<T>(null)
  const { start = 'top bottom', end = 'bottom top' } = options

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) {
      return undefined
    }
    ensureRegistered()

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: strength * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: true,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [strength, start, end])

  return ref
}

/**
 * Magnetic hover for premium CTAs. Attach the returned ref to a DOM element;
 * it leans toward the pointer and springs back on leave.
 */
export const useMagnetic = <T extends HTMLElement = HTMLButtonElement>(intensity = 0.32) => {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) {
      return undefined
    }
    ensureRegistered()

    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = event.clientX - (rect.left + rect.width / 2)
      const y = event.clientY - (rect.top + rect.height / 2)
      gsap.to(el, { x: x * intensity, y: y * intensity, duration: 0.5, ease: 'power3.out' })
    }
    const reset = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' })
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', reset)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', reset)
      gsap.killTweensOf(el)
    }
  }, [intensity])

  return ref
}
