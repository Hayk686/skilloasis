import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie } from '@/lib/gamify'
import { explainConcept } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const concept: string = (body.concept ?? '').toString().trim()
    if (!concept) {
      return NextResponse.json({ error: 'Укажите концепцию' }, { status: 400 })
    }
    const text = await explainConcept(concept)
    const res = NextResponse.json({ text, concept })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/explain] error', err)
    return NextResponse.json({ error: 'Не удалось объяснить' }, { status: 500 })
  }
}
