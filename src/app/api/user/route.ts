import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, touchStreak, levelFromXp } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getOrCreateUser()
  await touchStreak(user.id)
  const full = await db.user.findUnique({
    where: { id: user.id },
    include: {
      achievements: true,
      _count: {
        select: { progress: true, flashcards: true, chatSessions: true, lessons: true },
      },
    },
  })
  const res = NextResponse.json({
    user: full
      ? {
          id: full.id,
          name: full.name,
          xp: full.xp,
          level: full.level,
          streak: full.streak,
          lastActive: full.lastActive,
          achievements: full.achievements,
          counts: full._count,
          computedLevel: levelFromXp(full.xp),
        }
      : null,
  })
  setUserIdCookie(res, user.id)
  return res
}

export async function PATCH(req: Request) {
  const user = await getOrCreateUser()
  const body = await req.json().catch(() => ({}))
  const data: { name?: string } = {}
  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim().slice(0, 32)
  }
  const updated = await db.user.update({ where: { id: user.id }, data })
  const res = NextResponse.json({ user: updated })
  setUserIdCookie(res, user.id)
  return res
}
