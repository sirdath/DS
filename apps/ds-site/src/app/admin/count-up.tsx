'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

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

    const counter = { n: 0 }
    const tween = gsap.to(counter, {
      n: value,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate() {
        el.textContent = prefix + formatWithSeparators(counter.n) + suffix
      },
      onComplete() {
        el.textContent = prefix + formatWithSeparators(value) + suffix
      },
    })

    return () => {
      tween.kill()
    }
  }, [value, prefix, suffix])

  // Server render: show final value immediately (no flash on hydration)
  const initial = prefix + formatWithSeparators(value) + suffix

  return <span ref={spanRef}>{initial}</span>
}
