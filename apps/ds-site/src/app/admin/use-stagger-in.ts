'use client'
import { useEffect, useRef } from 'react'

export function useStaggerIn<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Lazy-load GSAP so it leaves the route's initial bundle (faster hydration on
    // every page that lists cards). The entrance animation just runs a beat later.
    let cancelled = false
    let revert: (() => void) | undefined
    void import('gsap').then(({ default: gsap }) => {
      if (cancelled || !root.isConnected) return
      const items = root.querySelectorAll('[data-stagger]')
      const ctx = gsap.context(() => {
        gsap.from(items, { opacity: 0, y: 18, duration: 0.5, stagger: 0.05, ease: 'power2.out' })
      }, root)
      revert = () => ctx.revert()
    })
    return () => {
      cancelled = true
      revert?.()
    }
  }, [])
  return ref
}
