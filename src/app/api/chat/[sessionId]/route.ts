import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateUser, setUserIdCookie } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getOrCreateUser()
  const { sessionId } = await params
  const session = await db.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!session) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
  }
  const res = NextResponse.json({ session })
  setUserIdCookie(res, user.id)
  return res
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getOrCreateUser()
  const { sessionId } = await params
  await db.chatSession.deleteMany({ where: { id: sessionId, userId: user.id } })
  const res = NextResponse.json({ ok: true })
  setUserIdCookie(res, user.id)
  return res
}
