import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie } from '@/lib/gamify'
import { generatePath } from '@/lib/ai'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const pathSchema = z.object({
  goal: shortText(300),
  level: z.string().trim().max(64).optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, pathSchema)
    if (!parsed.success) return parsed.response
    const { goal, level } = parsed.data
    const path = await generatePath(goal, level)
    const res = NextResponse.json({ path })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/paths] error', err)
    return NextResponse.json({ error: 'Не удалось построить маршрут' }, { status: 500 })
  }
}
