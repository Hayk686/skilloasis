import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { awardXpOnce, getOrCreateUser, setUserIdCookie, unlockAchievement } from '@/lib/gamify'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bookmarkSchema = z.object({
  topic: shortText(200),
  subject: shortText(64).default('general'),
  lessonJson: z.union([
    z.string().max(200_000),
    z.record(z.string(), z.unknown()),
  ]),
})

const deleteBookmarkSchema = z.object({ topic: shortText(200) })

/** Get all bookmarks for the current user. */
export async function GET() {
  const user = await getOrCreateUser()
  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  const res = NextResponse.json({ bookmarks })
  setUserIdCookie(res, user.id)
  return res
}

/** Create (bookmark) a lesson. */
export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, bookmarkSchema)
    if (!parsed.success) return parsed.response
    const { topic, subject } = parsed.data
    const lessonJson = typeof parsed.data.lessonJson === 'string'
      ? parsed.data.lessonJson
      : JSON.stringify(parsed.data.lessonJson)

    const bookmark = await db.bookmark.upsert({
      where: { userId_topic: { userId: user.id, topic } },
      create: { userId: user.id, topic, subject, lessonJson },
      update: { lessonJson, subject },
    })

    await unlockAchievement(user.id, 'first_lesson') // reuse; could add dedicated bookmark achievement
    const xpResult = await awardXpOnce(
      user.id,
      3,
      'bookmark',
      `${subject}:${topic.toLocaleLowerCase()}`
    )
    const updated = xpResult.user ?? user

    const res = NextResponse.json({
      bookmark,
      xpGain: xpResult.awarded,
      xp: updated.xp,
      level: updated.level,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/bookmarks POST] error', err)
    return NextResponse.json({ error: 'Не удалось сохранить' }, { status: 500 })
  }
}

/** Delete a bookmark by topic. */
export async function DELETE(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, deleteBookmarkSchema)
    if (!parsed.success) return parsed.response
    const { topic } = parsed.data
    await db.bookmark.deleteMany({ where: { userId: user.id, topic } })
    const res = NextResponse.json({ ok: true })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/bookmarks DELETE] error', err)
    return NextResponse.json({ error: 'Не удалось удалить' }, { status: 500 })
  }
}
