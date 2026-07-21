import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getOrCreateUser, setUserIdCookie, grantXp } from '@/lib/gamify'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPPORTED_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440',
] as const

/**
 * POST /api/image
 * Body: { prompt, size? }
 * Returns: { url } where url is a base64 data URI (so no static file serving needed).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const prompt: string = (body.prompt ?? '').toString().trim()
    const size: string = SUPPORTED_SIZES.includes(body.size)
      ? body.size
      : '1024x1024'

    if (!prompt) {
      return NextResponse.json({ error: 'Опишите изображение' }, { status: 400 })
    }

    // Enrich the prompt for an educational illustration style
    const enriched = `${prompt}, educational illustration, vibrant, cosmic gradient background with violet and fuchsia tones, modern digital art, high quality, detailed`

    const zai = await ZAI.create()
    const response = await zai.images.generations.create({
      prompt: enriched,
      size: size as (typeof SUPPORTED_SIZES)[number],
    })

    const imageBase64 = response.data?.[0]?.base64
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Пустой ответ генератора' },
        { status: 500 }
      )
    }

    const dataUri = `data:image/png;base64,${imageBase64}`

    await grantXp(user.id, 3)

    const res = NextResponse.json({ url: dataUri })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/image] error', err)
    return NextResponse.json(
      { error: 'Не удалось сгенерировать изображение' },
      { status: 500 }
    )
  }
}
