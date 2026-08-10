import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { levelFromXp } from '@/lib/gamify-client'
import { createHmac, timingSafeEqual } from 'node:crypto'

export { xpForLevel, levelFromXp, levelProgress, ACHIEVEMENTS, type AchievementType } from '@/lib/gamify-client'

const COOKIE_NAME = 'lumina_uid'

function sessionSecret(): string {
  const secret = process.env.LUMINA_SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('LUMINA_SESSION_SECRET must contain at least 32 characters')
  }
  return 'lumina-development-secret-change-me'
}

function signUserId(userId: string): string {
  return createHmac('sha256', sessionSecret()).update(userId).digest('base64url')
}

function readSignedUserId(value?: string): string | undefined {
  if (!value) return undefined
  const separator = value.lastIndexOf('.')
  if (separator <= 0) return undefined
  const userId = value.slice(0, separator)
  const received = value.slice(separator + 1)
  const expected = signUserId(userId)
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)
  if (receivedBuffer.length !== expectedBuffer.length) return undefined
  return timingSafeEqual(receivedBuffer, expectedBuffer) ? userId : undefined
}

/** Get or create an anonymous user identified by a signed cookie. */
export async function getOrCreateUser() {
  const cookieStore = await cookies()
  let userId = readSignedUserId(cookieStore.get(COOKIE_NAME)?.value)
  if (!userId) {
    const user = await db.user.create({ data: {} })
    userId = user.id
  }
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    const created = await db.user.create({ data: {} })
    userId = created.id
    return created
  }
  return user
}

/** Sets cookie in a response (called from API routes via NextResponse). */
export function setUserIdCookie(res: Response, userId: string) {
  const value = `${userId}.${signUserId(userId)}`
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${value}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  )
}

export async function grantXp(userId: string, amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1000) {
    throw new Error('Invalid XP amount')
  }
  return db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    })
    const level = levelFromXp(user.xp)
    if (level === user.level) return user
    return tx.user.update({
      where: { id: userId },
      data: { level },
    })
  })
}

/** Award an XP event at most once, even if the request is retried concurrently. */
export async function awardXpOnce(
  userId: string,
  amount: number,
  source: string,
  sourceId: string
) {
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1000) {
    throw new Error('Invalid XP amount')
  }
  if (!source || !sourceId) throw new Error('XP event identity is required')
  try {
    const user = await db.$transaction(async (tx) => {
      await tx.xpEvent.create({ data: { userId, amount, source, sourceId } })
      const updated = await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: amount } },
      })
      const level = levelFromXp(updated.xp)
      return level === updated.level
        ? updated
        : tx.user.update({ where: { id: userId }, data: { level } })
    })
    return { user, awarded: amount }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        user: await db.user.findUnique({ where: { id: userId } }),
        awarded: 0,
      }
    }
    throw error
  }
}

export async function touchStreak(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return null
  const now = new Date()
  const last = user.lastActive ? new Date(user.lastActive) : null
  let streak = user.streak
  if (!last) {
    streak = 1
  } else {
    const dayMs = 24 * 60 * 60 * 1000
    const diff = now.getTime() - last.getTime()
    const sameDay =
      now.getFullYear() === last.getFullYear() &&
      now.getMonth() === last.getMonth() &&
      now.getDate() === last.getDate()
    if (sameDay) {
      // same day, keep streak
    } else if (diff < 2 * dayMs) {
      streak += 1
    } else {
      streak = 1
    }
  }
  return db.user.update({
    where: { id: userId },
    data: { lastActive: now, streak },
  })
}

export async function unlockAchievement(userId: string, type: string, meta?: string) {
  try {
    await db.achievement.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type, meta },
      update: {},
    })
  } catch {
    // already exists
  }
}

export async function recordProgress(
  userId: string,
  subject: string,
  topic: string,
  score: number,
  total: number,
  kind: 'quiz' | 'lesson' | 'flashcard' | 'chat' = 'quiz'
) {
  return db.progress.create({
    data: { userId, subject, topic, score, total, kind },
  })
}
