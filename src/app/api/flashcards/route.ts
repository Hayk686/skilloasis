import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement } from '@/lib/gamify'
import { generateFlashcards } from '@/lib/ai'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const flashcardsSchema = z.object({
  topic: shortText(200),
  subject: shortText(64).default('general'),
  count: z.number().int().min(3).max(20).default(8),
})

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, flashcardsSchema)
    if (!parsed.success) return parsed.response
    const { topic, subject, count } = parsed.data

    const cards = await generateFlashcards(topic, count)
    // Persist cards
    if (cards.length) {
      await db.flashcard.createMany({
        data: cards.map((c) => ({
          userId: user.id,
          subject,
          front: c.front,
          back: c.back,
        })),
      })
    }
    await unlockAchievement(user.id, 'first_flashcard')
    const updated = await grantXp(user.id, 15)

    const res = NextResponse.json({
      cards,
      xp: updated?.xp ?? user.xp,
      level: updated?.level ?? user.level,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/flashcards] error', err)
    return NextResponse.json(
      { error: 'Не удалось создать флешкарты.' },
      { status: 500 }
    )
  }
}

/** Get due cards for review (spaced repetition). */
export async function GET(req: Request) {
  const user = await getOrCreateUser()
  const url = new URL(req.url)
  const subject = url.searchParams.get('subject')
  const limit = Math.min(50, Number(url.searchParams.get('limit')) || 20)
  const where: { userId: string; dueAt?: { lte: Date }; subject?: string } = {
    userId: user.id,
    dueAt: { lte: new Date() },
  }
  if (subject) where.subject = subject
  const cards = await db.flashcard.findMany({
    where,
    orderBy: { dueAt: 'asc' },
    take: limit,
  })
  const res = NextResponse.json({ cards })
  setUserIdCookie(res, user.id)
  return res
}
