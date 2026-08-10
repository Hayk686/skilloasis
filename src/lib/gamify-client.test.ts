import { describe, expect, it } from 'vitest'
import { levelFromXp, levelProgress, xpForLevel } from './gamify-client'

describe('gamification levels', () => {
  it('uses stable cumulative thresholds', () => {
    expect(xpForLevel(2)).toBe(300)
    expect(levelFromXp(299)).toBe(1)
    expect(levelFromXp(300)).toBe(2)
  })

  it('keeps progress percentage bounded', () => {
    expect(levelProgress(0).pct).toBeGreaterThanOrEqual(0)
    expect(levelProgress(100_000).pct).toBeLessThanOrEqual(100)
  })
})
