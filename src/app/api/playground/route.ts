import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement } from '@/lib/gamify'
import { complete } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const PLAYGROUND_SYSTEM = `Ты — дружелюбный AI-наставник по программированию в платформе Lumina.
Пользователь пишет JavaScript-код в песочнице и просит помощи.

Отвечай ВСЕГДА на русском языке, кратко и по делу. Используй Markdown.

Структура ответа:
1. **Краткий разбор** — что делает код, есть ли проблемы (1-3 предложения).
2. **Подсказка** — конкретный совет, как улучшить или исправить. Не давай сразу готовое решение, если пользователь просит «подсказку» — направляй к ответу.
3. **Пример** — небольшой фрагмент кода в \`\`\`js блоке, иллюстрирующий совет.

Если передан error — объясни причину ошибки простыми словами и как её исправить.
Если код корректен — похвали и предложи усложнение / следующее упражнение.
Будь воодушевляющим, как хороший ментор. Используй эмодзи умеренно.`

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const body = await req.json().catch(() => ({}))
    const code: string = (body.code ?? '').toString().trim()
    const error: string | null = body.error ? String(body.error).trim() : null
    const task: string | null = body.task ? String(body.task).trim() : null

    if (!code) {
      return NextResponse.json({ error: 'Нет кода для разбора' }, { status: 400 })
    }

    const userMessage = `Вот мой код:
\`\`\`js
${code}
\`\`\`
${error ? `\nПри запуске возникла ошибка:\n\`\`\`\n${error}\n\`\`\`\nПомоги понять, в чём дело и как исправить.` : ''}
${task ? `\nЗадание, которое я пытаюсь решить: ${task}` : ''}
${!error && !task ? '\nДай подсказку, как улучшить или что попробовать дальше.' : ''}`

    const hint = await complete(
      PLAYGROUND_SYSTEM,
      [{ role: 'user', content: userMessage }],
      { temperature: 0.6 }
    )

    // Gamify: XP for using the playground + achievement
    await grantXp(user.id, 5)
    await unlockAchievement(user.id, 'first_code')

    const res = NextResponse.json({ hint, ok: true })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/playground] error', err)
    return NextResponse.json({ error: 'AI-наставник временно недоступен' }, { status: 500 })
  }
}
