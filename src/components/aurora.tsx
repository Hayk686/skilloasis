'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Animated aurora background — soft floating gradient blobs.
 */
export function AuroraBackground({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
    >
      <div className="absolute inset-0 bg-grid opacity-[0.35] mask-radial" />
      <div
        className={cn('aurora-orb absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full blur-3xl opacity-40', animated && 'animate-aurora')}
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.7 0.25 315), transparent 60%)',
        }}
      />
      <div
        className={cn('aurora-orb absolute top-1/3 -right-40 h-[38rem] w-[38rem] rounded-full blur-3xl opacity-35', animated && 'animate-aurora-slow')}
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.72 0.2 175), transparent 60%)',
        }}
      />
      <div
        className={cn('aurora-orb absolute -bottom-48 left-1/4 h-[40rem] w-[40rem] rounded-full blur-3xl opacity-30', animated && 'animate-aurora')}
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.72 0.22 55), transparent 60%)',
        }}
      />
    </div>
  )
}

/** Floating particles for hero / accents. */
export function Particles({ count = 18 }: { count?: number }) {
  const items = Array.from({ length: count })
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((_, i) => {
        const left = (i * 53) % 100
        const top = (i * 37) % 100
        const size = 2 + (i % 4)
        const delay = (i % 7) * 0.6
        const dur = 6 + (i % 5) * 2
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-primary/40"
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
            animate={{ y: [0, -22, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      })}
    </div>
  )
}
