import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement } from '@/lib/gamify'
import { parseJsonBody } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ttsSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  voice: z.string().trim().regex(/^[a-zA-Z0-9_-]+$/).max(32).default('tongtong'),
  speed: z.number().min(0.5).max(2).default(1),
})

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
    const parsed = await parseJsonBody(req, ttsSchema)
    if (!parsed.success) return parsed.response
    const { text: input, voice, speed } = parsed.data

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
