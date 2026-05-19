'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useStaggerIn<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const items = root.querySelectorAll('[data-stagger]')
    const ctx = gsap.context(() => {
      gsap.from(items, { opacity: 0, y: 18, duration: 0.5, stagger: 0.05, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [])
  return ref
}
