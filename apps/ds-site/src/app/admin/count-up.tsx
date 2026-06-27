'use client'
import { useEffect, useRef } from 'react'

interface CountUpProps {
  value: number
  prefix?: string
  suffix?: string
}

function formatWithSeparators(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function CountUp({ value, prefix = '', suffix = '' }: CountUpProps) {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      el.textContent = prefix + formatWithSeparators(value) + suffix
      return
    }

    // Lazy-load GSAP so it never sits in the dashboard route bundle.
    let cancelled = false
    let tween: { kill: () => void } | null = null
    void import('gsap').then(({ default: gsap }) => {
      if (cancelled || !spanRef.current) return
      const counter = { n: 0 }
      tween = gsap.to(counter, {
        n: value,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate() {
          if (spanRef.current) spanRef.current.textContent = prefix + formatWithSeparators(counter.n) + suffix
        },
        onComplete() {
          if (spanRef.current) spanRef.current.textContent = prefix + formatWithSeparators(value) + suffix
        },
      })
    })

    return () => {
      cancelled = true
      tween?.kill()
    }
  }, [value, prefix, suffix])

  // Server render: show final value immediately (no flash on hydration)
  const initial = prefix + formatWithSeparators(value) + suffix

  return <span ref={spanRef}>{initial}</span>
}
