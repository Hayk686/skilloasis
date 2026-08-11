import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement } from '@/lib/gamify'
import { complete } from '@/lib/ai'
import { parseJsonBody } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const playgroundSchema = z.object({
  code: z.string().trim().min(1).max(20_000),
  error: z.string().trim().max(5_000).nullable().optional(),
  task: z.string().trim().max(1_000).nullable().optional(),
  language: z.enum(['javascript', 'typescript', 'python', 'html', 'java', 'cpp', 'csharp', 'go', 'rust']).default('javascript'),
  locale: z.enum(['ru', 'en', 'hy']).default('en'),
})

const RESPONSE_LANGUAGES = {
  ru: 'Отвечай только на русском языке.',
  en: 'Answer only in English.',
  hy: 'Պատասխանիր միայն գրական հայերենով։',
} as const

const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  html: 'HTML/CSS',
  java: 'Java',
  cpp: 'C++',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
} as const

const CODE_FENCES = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  html: 'html',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
} as const

type PlaygroundLanguage = keyof typeof LANGUAGE_LABELS

const buildPlaygroundSystem = (language: PlaygroundLanguage, locale: 'ru' | 'en' | 'hy') => `Ты — дружелюбный AI-наставник по программированию в платформе SkillOasis.
Пользователь пишет код на ${LANGUAGE_LABELS[language]} в песочнице и просит помощи.
${RESPONSE_LANGUAGES[locale]}

Отвечай кратко и по делу. Используй Markdown.

Структура ответа:
1. **Краткий разбор** — что делает код, есть ли проблемы (1-3 предложения).
2. **Подсказка** — конкретный совет, как улучшить или исправить. Не давай сразу готовое решение, если пользователь просит «подсказку» — направляй к ответу.
3. **Пример** — небольшой фрагмент кода в \`\`\`${CODE_FENCES[language]} блоке, иллюстрирующий совет.

Если передан error — объясни причину ошибки простыми словами и как её исправить.
Если код корректен — похвали и предложи усложнение / следующее упражнение.
Будь воодушевляющим, как хороший ментор. Используй эмодзи умеренно.`

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, playgroundSchema)
    if (!parsed.success) return parsed.response
    const { code, error = null, task = null, language, locale } = parsed.data

    const userMessage = `Вот мой код:
\`\`\`${CODE_FENCES[language]}
${code}
\`\`\`
${error ? `\nПри запуске возникла ошибка:\n\`\`\`\n${error}\n\`\`\`\nПомоги понять, в чём дело и как исправить.` : ''}
${task ? `\nЗадание, которое я пытаюсь решить: ${task}` : ''}
${!error && !task ? '\nДай подсказку, как улучшить или что попробовать дальше.' : ''}`

    const hint = await complete(
      buildPlaygroundSystem(language, locale),
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
