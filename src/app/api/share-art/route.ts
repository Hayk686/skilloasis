import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement } from '@/lib/gamify'
import { getAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ART_STYLES = [
  {
    id: 'cosmic',
    label: 'Космос',
    prompt:
      'Abstract cosmic nebula background, deep violet and fuchsia and pink gradient, glowing stars, ethereal aurora, ultra high quality, digital art, no text, no characters',
  },
  {
    id: 'aurora',
    label: 'Сияние',
    prompt:
      'Abstract aurora borealis background, flowing waves of violet magenta and teal light, dark sky with stars, dreamy atmosphere, high quality digital painting, no text',
  },
  {
    id: 'geometric',
    label: 'Геометрия',
    prompt:
      'Abstract geometric pattern background, violet fuchsia pink gradient, sacred geometry, glowing lines, dark background, modern minimalist digital art, no text',
  },
  {
    id: 'fluid',
    label: 'Поток',
    prompt:
      'Abstract fluid art background, violet magenta pink and gold swirling colors, marble texture, luxurious, high quality, no text, no characters',
  },
]

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const styleId: string = (body.style ?? 'cosmic').toString()
    const style = ART_STYLES.find((s) => s.id === styleId) ?? ART_STYLES[0]

    const zai = await getAI()
    const response = await zai.images.generations.create({
      prompt: style.prompt,
      size: '1344x768',
    })

    const imageBase64 = response.data?.[0]?.base64
    if (!imageBase64) {
      throw new Error('Пустой ответ от API генерации изображений')
    }

    // Gamify: XP for generating share art + achievement
    await grantXp(user.id, 8)
    await unlockAchievement(user.id, 'first_share')

    const res = NextResponse.json({
      image: `data:image/png;base64,${imageBase64}`,
      style: style.id,
      styleLabel: style.label,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/share-art] error', err)
    return NextResponse.json(
      { error: 'Не удалось сгенерировать арт. Попробуйте ещё раз.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ styles: ART_STYLES })
}
