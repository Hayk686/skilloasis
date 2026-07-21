'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useUser } from '@/lib/store'

/**
 * A toggle button that bookmarks/unbookmarks a lesson.
 * Fetches the current bookmark state on mount from GET /api/bookmarks.
 */
export function BookmarkButton({
  topic,
  subject,
  lessonJson,
  className,
}: {
  topic: string
  subject: string
  lessonJson: string
  className?: string
}) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const { xp, level } = useUser()

  // Check if already bookmarked
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch('/api/bookmarks', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          const exists = data.bookmarks?.some((b: { topic: string }) => b.topic === topic)
          setSaved(!!exists)
          setChecked(true)
        }
      } catch {
        setChecked(true)
      }
    }
    check()
    return () => { cancelled = true }
  }, [topic])

  const toggle = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      if (saved) {
        const res = await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        })
        if (!res.ok) throw new Error('Ошибка удаления')
        setSaved(false)
        toast.success('Удалено из избранного')
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, subject, lessonJson }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSaved(true)
        useUser.setState({ xp: data.xp ?? xp, level: data.level ?? level })
        toast.success('Сохранено в избранное +3 XP')
      }
    } catch {
      toast.error('Не удалось сохранить')
    } finally {
      setLoading(false)
    }
  }, [saved, loading, topic, subject, lessonJson, xp, level])

  if (!checked) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Убрать из избранного' : 'Сохранить в избранное'}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-all disabled:opacity-60',
        saved
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
          : 'border-border/60 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Bookmark className={cn('h-3.5 w-3.5 transition-all', saved && 'fill-primary')} />
      )}
      <span>{saved ? 'Сохранено' : 'Сохранить'}</span>
    </button>
  )
}
