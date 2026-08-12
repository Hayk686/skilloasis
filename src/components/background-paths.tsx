'use client'

import { motion, useReducedMotion } from 'framer-motion'

const PATHS = Array.from({ length: 28 }, (_, index) => {
  const y = 80 + index * 21
  const curve = 90 + (index % 7) * 18
  return {
    id: index,
    d: `M -120 ${y} C 180 ${y - curve}, 390 ${y + curve}, 760 ${y + 30} S 1260 ${y - curve * 0.6}, 1660 ${y + 10}`,
    delay: index * 0.12,
    duration: 7.5 + (index % 5) * 0.65,
  }
})

export function BackgroundPaths() {
  const reduceMotion = useReducedMotion()

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(168,85,247,0.14),transparent_34%),radial-gradient(circle_at_84%_66%,rgba(34,211,238,0.10),transparent_30%)]" />
      <svg
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full opacity-70 dark:opacity-85"
      >
        <defs>
          <linearGradient id="info-oasis-path-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="28%" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ec4899" stopOpacity="0.72" />
            <stop offset="82%" stopColor="#22d3ee" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#info-oasis-path-gradient)" strokeLinecap="round">
          {PATHS.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              strokeWidth={0.7 + (path.id % 4) * 0.22}
              initial={reduceMotion ? { pathLength: 1, opacity: 0.28 } : { pathLength: 0.06, pathOffset: 0, opacity: 0 }}
              animate={
                reduceMotion
                  ? { pathLength: 1, opacity: 0.28 }
                  : {
                      pathLength: [0.06, 0.52, 0.08],
                      pathOffset: [0, 0.48, 0.92],
                      opacity: [0, 0.72, 0],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: path.duration,
                      delay: path.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
            />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/5 to-background/85" />
    </div>
  )
}
