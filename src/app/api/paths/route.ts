import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie } from '@/lib/gamify'
import { generatePath } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const goal: string = (body.goal ?? '').toString().trim()
    const level: string | undefined = body.level
    if (!goal) {
      return NextResponse.json({ error: 'Укажите цель' }, { status: 400 })
    }
    const path = await generatePath(goal, level)
    const res = NextResponse.json({ path })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/paths] error', err)
    return NextResponse.json({ error: 'Не удалось построить маршрут' }, { status: 500 })
  }
}
