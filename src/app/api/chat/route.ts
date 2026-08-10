import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement, recordProgress } from '@/lib/gamify'
import { tutorChat, ChatTurn } from '@/lib/ai'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const chatSchema = z.object({
  message: shortText(8000),
  subject: shortText(64).default('general'),
  sessionId: z.string().cuid().optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, chatSchema)
    if (!parsed.success) return parsed.response
    const { message, subject, sessionId } = parsed.data

    // Persist session + messages
    let session = sessionId
      ? await db.chatSession.findUnique({ where: { id: sessionId } })
      : null
    if (!session || session.userId !== user.id) {
      session = await db.chatSession.create({
        data: {
          userId: user.id,
          subject,
          title: message.slice(0, 60),
        },
      })
    }
    await db.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: message },
    })

    // Build conversation from DB + new message
    const dbMessages = await db.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })
    const turns: ChatTurn[] = dbMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const reply = await tutorChat(turns, subject)
    await db.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: reply },
    })

    // Gamify: first chat achievement + small xp
    await unlockAchievement(user.id, 'first_chat')
    const updated = await grantXp(user.id, 5)
    await recordProgress(user.id, subject, 'chat', 1, 1, 'chat')
    await db.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    })

    const res = NextResponse.json({
      reply,
      sessionId: session.id,
      xp: updated?.xp ?? user.xp,
      level: updated?.level ?? user.level,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/chat] error', err)
    return NextResponse.json(
      { error: 'Не удалось получить ответ. Попробуйте ещё раз.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const user = await getOrCreateUser()
  const sessions = await db.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    include: { _count: { select: { messages: true } } },
  })
  const res = NextResponse.json({ sessions })
  setUserIdCookie(res, user.id)
  return res
}
