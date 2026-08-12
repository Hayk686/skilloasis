import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { levelFromXp } from '@/lib/gamify-client'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getSupabasePublicConfig } from '@/lib/supabase/config'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { DEFAULT_GUEST_NAME } from '@/lib/i18n-config'

export { xpForLevel, levelFromXp, levelProgress, ACHIEVEMENTS, type AchievementType } from '@/lib/gamify-client'

const COOKIE_NAME = 'info_oasis_uid'
const LEGACY_COOKIE_NAMES = ['skilloasis_uid', 'lumina_uid'] as const

function sessionSecret(): string {
  const secret =
    process.env.INFO_OASIS_SESSION_SECRET ??
    process.env.SKILLOASIS_SESSION_SECRET ??
    process.env.LUMINA_SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('INFO_OASIS_SESSION_SECRET must contain at least 32 characters')
  }
  return 'info-oasis-development-secret-change-me'
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

interface AuthIdentity {
  id: string
  email: string | null
  name: string | null
  avatar: string | null
}

function metadataText(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || !(key in metadata)) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function getAuthenticatedIdentity(): Promise<AuthIdentity | null> {
  if (!getSupabasePublicConfig()) return null
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data?.claims?.sub) return null
    const claims = data.claims
    const name =
      metadataText(claims.user_metadata, 'full_name') ??
      metadataText(claims.user_metadata, 'name') ??
      claims.email?.split('@')[0] ??
      null
    return {
      id: claims.sub,
      email: claims.email ?? null,
      name,
      avatar:
        metadataText(claims.user_metadata, 'avatar_url') ??
        metadataText(claims.user_metadata, 'picture'),
    }
  } catch (error) {
    console.warn('[auth] Could not verify Supabase session', error)
    return null
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' && 'code' in error && error.code === 'P2002'
  )
}

/** Get the signed-in account, or create/restore an anonymous cookie user. */
export async function getOrCreateUser() {
  const cookieStore = await cookies()
  const cookieUserId = readSignedUserId(
    cookieStore.get(COOKIE_NAME)?.value ??
      LEGACY_COOKIE_NAMES.map((name) => cookieStore.get(name)?.value).find(Boolean)
  )
  const cookieUser = cookieUserId
    ? await db.user.findUnique({ where: { id: cookieUserId } })
    : null
  const identity = await getAuthenticatedIdentity()

  if (identity) {
    const accountUser = await db.user.findUnique({ where: { authId: identity.id } })
    if (accountUser) return accountUser

    if (cookieUser) {
      try {
        return await db.user.update({
          where: { id: cookieUser.id },
          data: {
            authId: identity.id,
            email: identity.email,
            ...(
              cookieUser.name === DEFAULT_GUEST_NAME && identity.name
                ? { name: identity.name }
                : {}
            ),
            ...(!cookieUser.avatar && identity.avatar ? { avatar: identity.avatar } : {}),
          },
        })
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error
        const concurrentAccount = await db.user.findUnique({ where: { authId: identity.id } })
        if (concurrentAccount) return concurrentAccount
        throw error
      }
    }

    try {
      return await db.user.create({
        data: {
          authId: identity.id,
          email: identity.email,
          name: identity.name ?? DEFAULT_GUEST_NAME,
          avatar: identity.avatar,
        },
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
      const concurrentAccount = await db.user.findUnique({ where: { authId: identity.id } })
      if (concurrentAccount) return concurrentAccount
      throw error
    }
  }

  return cookieUser ?? db.user.create({ data: {} })
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
  for (const cookieName of LEGACY_COOKIE_NAMES) {
    res.headers.append(
      'Set-Cookie',
      `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    )
  }
}

export function clearUserIdCookie(res: Response) {
  for (const cookieName of [COOKIE_NAME, ...LEGACY_COOKIE_NAMES]) {
    res.headers.append(
      'Set-Cookie',
      `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    )
  }
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
