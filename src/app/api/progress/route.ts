import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getOrCreateUser()
  const [progress, achievements] = await Promise.all([
    db.progress.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
      take: 100,
    }),
    db.achievement.findMany({ where: { userId: user.id } }),
  ])

  // aggregate stats
  const bySubject: Record<string, { count: number; correct: number; total: number }> = {}
  for (const p of progress) {
    const s = (bySubject[p.subject] ||= { count: 0, correct: 0, total: 0 })
    s.count += 1
    s.correct += p.score
    s.total += p.total
  }
  const byKind: Record<string, number> = {}
  for (const p of progress) {
    byKind[p.kind] = (byKind[p.kind] || 0) + 1
  }
  // last 7 days activity
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recent = progress.filter((p) => p.completedAt >= since)
  const byDay: Record<string, number> = {}
  for (const p of recent) {
    const d = p.completedAt.toISOString().slice(0, 10)
    byDay[d] = (byDay[d] || 0) + 1
  }

  const res = NextResponse.json({
    progress,
    achievements,
    bySubject,
    byKind,
    byDay,
  })
  setUserIdCookie(res, user.id)
  return res
}
