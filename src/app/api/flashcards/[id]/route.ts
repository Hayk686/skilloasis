import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { awardXpOnce, getOrCreateUser, setUserIdCookie } from '@/lib/gamify'
import { parseJsonBody } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const reviewSchema = z.object({
  quality: z.enum(['again', 'hard', 'good', 'easy']),
})

/** Update a card based on SM-2-style feedback: "again" | "hard" | "good" | "easy". */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser()
  const { id } = await params
  const parsed = await parseJsonBody(req, reviewSchema)
  if (!parsed.success) return parsed.response
  const { quality } = parsed.data

  const card = await db.flashcard.findFirst({ where: { id, userId: user.id } })
  if (!card) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
  }
  if (card.dueAt.getTime() > Date.now()) {
    return NextResponse.json({ error: 'Карточка ещё не готова к повторению' }, { status: 409 })
  }

  // SM-2 simplified
  const qMap = { again: 0, hard: 3, good: 4, easy: 5 } as const
  const q = qMap[quality]
  let { easeFactor, interval, repetitions } = card
  if (q < 3) {
    repetitions = 0
    interval = 1
  } else {
    repetitions += 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 3
    else interval = Math.round(interval * easeFactor)
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  }
  const dueAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000)
  const updated = await db.flashcard.update({
    where: { id },
    data: { easeFactor, interval, repetitions, dueAt },
  })

  let xpGain = 0
  if (quality === 'good' || quality === 'easy') xpGain = 3
  if (quality === 'easy') xpGain = 5
  const reviewId = `${card.id}:${card.repetitions}:${card.dueAt.toISOString()}`
  const xpResult = xpGain
    ? await awardXpOnce(user.id, xpGain, 'flashcard-review', reviewId)
    : { user, awarded: 0 }
  const updatedUser = xpResult.user ?? user

  const res = NextResponse.json({
    card: updated,
    xpGain: xpResult.awarded,
    xp: updatedUser.xp,
    level: updatedUser.level,
  })
  setUserIdCookie(res, user.id)
  return res
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser()
  const { id } = await params
  await db.flashcard.deleteMany({ where: { id, userId: user.id } })
  const res = NextResponse.json({ ok: true })
  setUserIdCookie(res, user.id)
  return res
}
