import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateDailyChallenge } from '@/lib/ai'
import { awardXpOnce, getOrCreateUser, setUserIdCookie } from '@/lib/gamify'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DAILY_XP = 30

function today() {
  const date = new Date().toISOString().slice(0, 10)
  return { date, value: new Date(`${date}T00:00:00.000Z`) }
}

export async function GET() {
  try {
    const user = await getOrCreateUser()
    const current = today()
    const [challenge, completion] = await Promise.all([
      generateDailyChallenge(current.date),
      db.dailyCompletion.findUnique({
        where: {
          userId_challengeDate: {
            userId: user.id,
            challengeDate: current.value,
          },
        },
      }),
    ])
    challenge.date = current.date
    challenge.xpReward = DAILY_XP
    const res = NextResponse.json({ challenge, completed: Boolean(completion) })
    setUserIdCookie(res, user.id)
    return res
  } catch (error) {
    console.error('[api/daily] error', error)
    return NextResponse.json({ error: 'Не удалось получить вызов' }, { status: 500 })
  }
}

/** Complete today's challenge once. The reward is always decided by the server. */
export async function POST() {
  try {
    const user = await getOrCreateUser()
    const current = today()
    const existing = await db.dailyCompletion.findUnique({
      where: {
        userId_challengeDate: {
          userId: user.id,
          challengeDate: current.value,
        },
      },
    })
    if (existing) {
      const res = NextResponse.json({
        ok: true,
        alreadyCompleted: true,
        xp: user.xp,
        level: user.level,
        xpGain: 0,
      })
      setUserIdCookie(res, user.id)
      return res
    }

    const result = await awardXpOnce(user.id, DAILY_XP, 'daily', current.date)
    await db.dailyCompletion
      .create({
        data: {
          userId: user.id,
          challengeDate: current.value,
          xpAwarded: result.awarded,
        },
      })
      .catch((error: unknown) => {
        if (
          typeof error !== 'object' ||
          error === null ||
          !('code' in error) ||
          error.code !== 'P2002'
        ) {
          throw error
        }
      })

    const updated = result.user ?? user
    const res = NextResponse.json({
      ok: true,
      alreadyCompleted: result.awarded === 0,
      xp: updated.xp,
      level: updated.level,
      xpGain: result.awarded,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (error) {
    console.error('[api/daily submit] error', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
