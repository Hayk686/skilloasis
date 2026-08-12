'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_GUEST_NAME } from '@/lib/i18n-config'
import { getPathForView } from '@/lib/seo'

export type ViewId =
  | 'home'
  | 'dashboard'
  | 'tutor'
  | 'lessons'
  | 'quiz'
  | 'flashcards'
  | 'paths'
  | 'subjects'
  | 'achievements'
  | 'mindmap'
  | 'playground'

interface UserState {
  userId: string | null
  name: string
  email: string | null
  avatar: string | null
  authenticated: boolean
  xp: number
  level: number
  streak: number
  hydrated: boolean
  setHydrated: (v: boolean) => void
}

interface NavState {
  view: ViewId
  activeSubject: string | null
  setView: (v: ViewId) => void
  setSubject: (s: string | null) => void
  openSubject: (subjectId: string) => void
}

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      name: DEFAULT_GUEST_NAME,
      email: null,
      avatar: null,
      authenticated: false,
      xp: 0,
      level: 1,
      streak: 0,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'info-oasis-user',
      skipHydration: true,
      partialize: (state) => ({
        userId: state.userId,
        name: state.name,
        xp: state.xp,
        level: state.level,
        streak: state.streak,
      }),
    }
  )
)

export const useNav = create<NavState>()((set) => ({
  view: 'home',
  activeSubject: null,
  setView: (v) => {
    if (typeof window !== 'undefined') {
      const nextPath = getPathForView(v)
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ view: v }, '', nextPath)
      }
    }
    set({ view: v })
  },
  setSubject: (s) => set({ activeSubject: s }),
  openSubject: (subjectId) => {
    if (typeof window !== 'undefined' && window.location.pathname !== getPathForView('subjects')) {
      window.history.pushState({ view: 'subjects' }, '', getPathForView('subjects'))
    }
    set({ activeSubject: subjectId, view: 'subjects' })
  },
}))

export const useUI = create<UIState>()((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (v) => set({ sidebarOpen: v }),
  commandOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),
}))
