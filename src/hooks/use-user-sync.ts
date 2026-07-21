'use client'

import { useEffect } from 'react'
import { useUser } from '@/lib/store'

/** Syncs the local user from the backend (creates one if needed) and updates the store. */
export function useUserSync() {
  const { setHydrated } = useUser()

  useEffect(() => {
    let cancelled = false

    // Rehydrate from localStorage AFTER first render (avoids hydration mismatch)
    useUser.persist.rehydrate()

    async function sync() {
      try {
        const res = await fetch('/api/user', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const u = data.user
        if (u && !cancelled) {
          useUser.setState({
            userId: u.id,
            name: u.name,
            xp: u.xp,
            level: u.computedLevel ?? u.level,
            streak: u.streak,
          })
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }

    sync()

    return () => {
      cancelled = true
    }
  }, [setHydrated])

  /** Manual refresh function. */
  return () => fetch('/api/user', { cache: 'no-store' }).then((r) => r.json())
}
