import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, touchStreak, levelFromXp } from '@/lib/gamify'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({ name: shortText(32) })

function runtimeErrorCode(error: unknown): string {
  if (!process.env.DATABASE_URL) return 'DATABASE_URL_MISSING'
  if (!process.env.DIRECT_URL) return 'DIRECT_URL_MISSING'
  const secret = process.env.LUMINA_SESSION_SECRET
  if (!secret || secret.length < 32) return 'SESSION_SECRET_INVALID'

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''
  if (code === 'P1000') return 'DATABASE_AUTH_FAILED'
  if (code === 'P1001') return 'DATABASE_UNREACHABLE'
  if (code === 'P1003') return 'DATABASE_NOT_FOUND'
  if (code === 'P1012' || code === 'P1013') return 'DATABASE_URL_INVALID'
  if (code === 'P2021' || code === 'P2022') return 'DATABASE_SCHEMA_MISSING'

  const message = error instanceof Error ? error.message : ''
  if (message.includes('Environment variable not found')) return 'DATABASE_ENV_MISSING'
  if (message.includes('does not exist')) return 'DATABASE_SCHEMA_MISSING'
  return 'DATABASE_ERROR'
}

export async function GET() {
  try {
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
  } catch (error) {
    console.error('[api/user] error', error)
    return NextResponse.json(
      { error: 'User service is unavailable', code: runtimeErrorCode(error) },
      { status: 500 }
    )
  }
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
