import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement } from '@/lib/gamify'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/tts
 * Body: { text, voice?, speed? }
 * Returns: audio/wav binary stream.
 *
 * Splits long text (>1000 chars) into chunks and concatenates WAV buffers
 * using a simple approach: returns the first chunk for now, or a JSON list
 * of chunk URLs when chunked. To keep the client simple, we return a single
 * WAV for text <= 1000 chars, and for longer text we return the first chunk
 * plus a `next` token the client can use to fetch subsequent chunks.
 *
 * For a v1 we keep it simple: truncate to 1000 chars and synthesize once.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const text: string = (body.text ?? '').toString().trim()
    const voice: string = (body.voice ?? 'tongtong').toString()
    const speed: number = Math.min(2, Math.max(0.5, Number(body.speed) || 1))

    if (!text) {
      return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 })
    }

    // Truncate to API limit (1024). The client already chunks, so this is a safety net.
    const input = text.slice(0, 1000)

    const zai = await ZAI.create()
    const response = await zai.audio.tts.create({
      input,
      voice,
      speed,
      response_format: 'wav',
      stream: false,
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))

    // Achievement: first audio narration
    await unlockAchievement(user.id, 'first_audio')
    await grantXp(user.id, 2)

    const res = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/tts] error', err)
    return NextResponse.json(
      { error: 'Не удалось сгенерировать аудио' },
      { status: 500 }
    )
  }
}
