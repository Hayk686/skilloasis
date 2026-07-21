import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement, recordProgress } from '@/lib/gamify'
import { generateQuiz } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const topic: string = (body.topic ?? '').toString().trim()
    const subject: string = (body.subject ?? 'general').toString()
    const count: number = Math.min(15, Math.max(3, Number(body.count) || 5))
    const level: string | undefined = body.level

    if (!topic) {
      return NextResponse.json({ error: 'Укажите тему' }, { status: 400 })
    }

    const questions = await generateQuiz(topic, count, level)

    const res = NextResponse.json({ questions, topic, subject })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/quiz] error', err)
    return NextResponse.json(
      { error: 'Не удалось создать квиз. Попробуйте ещё раз.' },
      { status: 500 }
    )
  }
}

/** Submit quiz answers, compute score & grant xp. */
export async function PUT(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const subject: string = (body.subject ?? 'general').toString()
    const topic: string = (body.topic ?? 'quiz').toString()
    const total: number = Number(body.total) || 0
    const correct: number = Number(body.correct) || 0

    await unlockAchievement(user.id, 'first_quiz')
    if (total > 0 && correct === total) {
      await unlockAchievement(user.id, 'quiz_perfect')
    }
    const xpGain = correct * 10 + (correct === total ? 20 : 0)
    const updated = await grantXp(user.id, xpGain)
    await recordProgress(user.id, subject, topic, correct, total, 'quiz')

    const res = NextResponse.json({
      correct,
      total,
      xpGain,
      xp: updated?.xp ?? user.xp,
      level: updated?.level ?? user.level,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/quiz submit] error', err)
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
  }
}
