'use client'

import { useEffect } from 'react'

/** Progressive enhancement: reveals each .pv2-section on scroll. Renders nothing,
 * runs entirely off the already-server-rendered DOM, and no-ops under reduced motion. */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancelled = false
    let ctx: { revert: () => void } | null = null
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.pv2-section').forEach((sec) => {
          const parts = [sec.querySelector('.pv2-section__intro'), sec.querySelector('.pv2-section__stage')].filter(Boolean)
          gsap.from(parts, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power2.out',
            stagger: 0.12,
            scrollTrigger: { trigger: sec, start: 'top 78%' },
          })
        })
      })
    })()
    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])
  return null
}
