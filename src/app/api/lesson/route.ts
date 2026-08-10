import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement, recordProgress } from '@/lib/gamify'
import { generateLesson } from '@/lib/ai'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const lessonSchema = z.object({
  topic: shortText(200),
  subject: shortText(64).default('general'),
  level: z.string().trim().max(64).optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, lessonSchema)
    if (!parsed.success) return parsed.response
    const { topic, subject, level } = parsed.data

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
