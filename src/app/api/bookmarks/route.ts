import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

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
    const body = await req.json().catch(() => ({}))
    const topic: string = (body.topic ?? '').toString().trim()
    const subject: string = (body.subject ?? 'general').toString()
    const lessonJson: string = typeof body.lessonJson === 'string' ? body.lessonJson : JSON.stringify(body.lessonJson ?? {})

    if (!topic) {
      return NextResponse.json({ error: 'Укажите тему' }, { status: 400 })
    }

    const bookmark = await db.bookmark.upsert({
      where: { userId_topic: { userId: user.id, topic } },
      create: { userId: user.id, topic, subject, lessonJson },
      update: { lessonJson, subject },
    })

    await unlockAchievement(user.id, 'first_lesson') // reuse; could add dedicated bookmark achievement
    const updated = await grantXp(user.id, 3)

    const res = NextResponse.json({ bookmark, xp: updated?.xp ?? user.xp, level: updated?.level ?? user.level })
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
    const body = await req.json().catch(() => ({}))
    const topic: string = (body.topic ?? '').toString().trim()
    if (!topic) {
      return NextResponse.json({ error: 'Укажите тему' }, { status: 400 })
    }
    await db.bookmark.deleteMany({ where: { userId: user.id, topic } })
    const res = NextResponse.json({ ok: true })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/bookmarks DELETE] error', err)
    return NextResponse.json({ error: 'Не удалось удалить' }, { status: 500 })
  }
}
