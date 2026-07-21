import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { levelFromXp } from '@/lib/gamify-client'

export { xpForLevel, levelFromXp, levelProgress, ACHIEVEMENTS, type AchievementType } from '@/lib/gamify-client'

/** Get or create the local user (identified by a cookie). */
export async function getOrCreateUser() {
  const cookieStore = await cookies()
  let userId = cookieStore.get('lumina_uid')?.value
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
  res.headers.append(
    'Set-Cookie',
    `lumina_uid=${userId}; Path=/; Max-Age=31536000; SameSite=Lax`
  )
}

export async function grantXp(userId: string, amount: number) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return null
  const newXp = user.xp + amount
  const newLevel = levelFromXp(newXp)
  const updated = await db.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  })
  return updated
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
