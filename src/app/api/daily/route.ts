import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie, grantXp } from '@/lib/gamify'
import { generateDailyChallenge } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getOrCreateUser()
    // Deterministic seed from date so it's stable per day
    const now = new Date()
    const seed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const challenge = await generateDailyChallenge(seed)
    // Ensure date is a proper, stable per-day ISO date string (YYYY-MM-DD)
    // so client Date parsing and localStorage "done" keys work consistently.
    const isoDate = now.toISOString().slice(0, 10)
    challenge.date = isoDate
    const res = NextResponse.json({ challenge })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/daily] error', err)
    return NextResponse.json({ error: 'Не удалось получить вызов' }, { status: 500 })
  }
}

/** Mark daily done — grants xp */
export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const xpReward: number = Number(body.xpReward) || 30
    const updated = await grantXp(user.id, xpReward)
    const res = NextResponse.json({
      ok: true,
      xp: updated?.xp ?? user.xp,
      level: updated?.level ?? user.level,
      xpGain: xpReward,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/daily submit] error', err)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
