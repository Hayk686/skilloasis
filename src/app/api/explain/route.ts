import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie } from '@/lib/gamify'
import { explainConcept } from '@/lib/ai'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const explainSchema = z.object({ concept: shortText(300) })

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, explainSchema)
    if (!parsed.success) return parsed.response
    const { concept } = parsed.data
    const text = await explainConcept(concept)
    const res = NextResponse.json({ text, concept })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/explain] error', err)
    return NextResponse.json({ error: 'Не удалось объяснить' }, { status: 500 })
  }
}
