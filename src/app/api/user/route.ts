import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, touchStreak, levelFromXp } from '@/lib/gamify'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({ name: shortText(32) })

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
  const parsed = await parseJsonBody(req, updateUserSchema)
  if (!parsed.success) return parsed.response
  const updated = await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  })
  const res = NextResponse.json({ user: updated })
  setUserIdCookie(res, user.id)
  return res
}
