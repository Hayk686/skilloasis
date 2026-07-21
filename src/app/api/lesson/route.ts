import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement, recordProgress } from '@/lib/gamify'
import { generateLesson } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const topic: string = (body.topic ?? '').toString().trim()
    const subject: string = (body.subject ?? 'general').toString()
    const level: string | undefined = body.level

    if (!topic) {
      return NextResponse.json({ error: 'Укажите тему' }, { status: 400 })
    }

    const lesson = await generateLesson(topic, level)

    await db.lessonView.create({
      data: { userId: user.id, subject, topic },
    })
    await unlockAchievement(user.id, 'first_lesson')
    const updated = await grantXp(user.id, 25)
    await recordProgress(user.id, subject, topic, 1, 1, 'lesson')

    const res = NextResponse.json({
      lesson,
      xp: updated?.xp ?? user.xp,
      level: updated?.level ?? user.level,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/lesson] error', err)
    return NextResponse.json(
      { error: 'Не удалось создать урок. Попробуйте ещё раз.' },
      { status: 500 }
    )
  }
}
