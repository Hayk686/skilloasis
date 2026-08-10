import ZAI from 'z-ai-web-dev-sdk'
import { getLanguageInstruction } from '@/lib/locale-server'

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null

export async function getAI() {
  if (!_zai) {
    _zai = await ZAI.create()
  }
  return _zai
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

interface CompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function openAICompatibleCompletion(
  messages: CompletionMessage[],
  temperature: number,
  json: boolean
): Promise<string> {
  const baseUrl = process.env.AI_BASE_URL?.replace(/\/$/, '')
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL
  if (!baseUrl || !apiKey || !model) {
    throw new Error('AI_BASE_URL, AI_API_KEY and AI_MODEL are required')
  }
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) {
    throw new Error(`AI provider returned ${response.status}`)
  }
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return payload.choices?.[0]?.message?.content ?? ''
}

/**
 * Core chat completion with a system prompt + history.
 */
export async function complete(
  system: string,
  messages: ChatTurn[],
  opts: { temperature?: number; json?: boolean } = {}
): Promise<string> {
  const languageInstruction = await getLanguageInstruction()
  const outputLanguageRule = `OUTPUT LANGUAGE — HIGHEST PRIORITY:
${languageInstruction}
This rule applies to every user-visible sentence and to every natural-language string value inside JSON. Translate labels and example text into that language. Do not follow conflicting language instructions elsewhere in the prompt.`
  const messagesWithSystem: CompletionMessage[] = [
    { role: 'system', content: `${system}\n\n${outputLanguageRule}` },
    ...messages,
  ]
  try {
    let content: string
    if (process.env.AI_PROVIDER === 'openai-compatible') {
      content = await openAICompatibleCompletion(
        messagesWithSystem,
        opts.temperature ?? 0.7,
        Boolean(opts.json)
      )
    } else {
      const zai = await getAI()
      const completion = await zai.chat.completions.create({
        messages: messagesWithSystem,
        thinking: { type: 'disabled' },
        temperature: opts.temperature ?? 0.7,
      })
      content = completion.choices[0]?.message?.content ?? ''
    }
    if (opts.json) {
      content = extractJson(content)
    }
    return content
  } catch (err) {
    console.error('[ai.complete] error', err)
    throw err
  }
}

/** Normalize common LLM output quirks before parsing. */
function normalizeJsonText(t: string): string {
  let s = t
  // Replace smart/curly quotes with straight quotes
  s = s.replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/[\u2018\u2019\u201A\u201B]/g, "'")
  // Remove zero-width chars and BOM
  s = s.replace(/[\uFEFF\u200B\u200C\u200D]/g, '')
  return s
}

/** Robust JSON extraction using balanced brace matching (handles nested objects + truncation). */
export function extractJson(text: string): string {
  let t = text.trim()
  // strip code fences ```json ... ``` (also partial fences without closing)
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i)
  if (fence) t = fence[1].trim()
  t = normalizeJsonText(t)
  // find first { or [
  const start = t.search(/[{[]/)
  if (start === -1) return t
  const open = t[start]
  const close = open === '{' ? '}' : ']'
  // balanced scan to find the matching close (handles nested braces + strings)
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < t.length; i++) {
    const ch = t[i]
    if (esc) { esc = false; continue }
    if (ch === '\\') { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return t.slice(start, i + 1)
    }
  }
  // truncated: return everything from start to end (best effort)
  return t.slice(start)
}

export function safeJsonParse<T>(raw: string, fallback: T): T {
  const candidates = [
    raw,
    // repair trailing commas
    raw.replace(/,\s*([}\]])/g, '$1'),
    // repair single-quoted strings -> double quotes
    raw.replace(/'/g, '"'),
  ]
  for (const c of candidates) {
    try {
      return JSON.parse(c) as T
    } catch {
      // try next
    }
  }
  return fallback
}

/* ===================== TUTOR ===================== */

const TUTOR_SYSTEM = `Ты — Lumina, тёплый, мудрый и воодушевляющий AI-наставник.
Принципы:
- Объясняй СЛОЖНОЕ ПРОСТО: используй аналогии из жизни, короткие примеры, шаги.
- Будь лаконичным, но не сухим. Используй Markdown: заголовки ##, списки, **жирный**, \`код\`, цитаты.
- Если уместно — задавай проверочный вопрос в конце, чтобы ученик думал дальше.
- Никогда не выдумывай факты. Если не уверен — скажи честно.
- Поддерживай и хвали за прогресс, но не льсти без повода.
- По математике/физике показывай ход решения по шагам.
- По программированию давай короткие рабочие примеры в коде.`

export async function tutorChat(history: ChatTurn[], subject?: string): Promise<string> {
  const sys = subject
    ? `${TUTOR_SYSTEM}\n\nТекущая тема обучения: ${subject}. Помогай именно в этой области, но не отказывайся от смежных вопросов.`
    : TUTOR_SYSTEM
  return complete(sys, history, { temperature: 0.7 })
}

/* ===================== LESSON GENERATION ===================== */

export interface LessonBlock {
  type: 'heading' | 'paragraph' | 'example' | 'analogy' | 'callout' | 'code' | 'steps' | 'quote'
  text?: string
  items?: string[]
  code?: string
  lang?: string
}

export interface Lesson {
  title: string
  emoji: string
  summary: string
  durationMin: number
  difficulty: string
  blocks: LessonBlock[]
  keyTakeaways: string[]
  nextTopic: string
}

const LESSON_SYSTEM = `Ты — мастер создания увлекательных обучающих уроков.
Создавай урок в СТРОГОМ JSON формате (без markdown вокруг), со структурой:
{
  "title": string,
  "emoji": string (один эмодзи),
  "summary": string (1-2 предложения, цепляющее введение),
  "durationMin": number (5-20),
  "difficulty": string (Лёгкий|Средний|Сложный),
  "blocks": [
    { "type": "heading", "text": "..." },
    { "type": "paragraph", "text": "..." },
    { "type": "analogy", "text": "Аналогия: ..." },
    { "type": "example", "text": "Пример: ..." },
    { "type": "callout", "text": "Важно: ..." },
    { "type": "code", "code": "...", "lang": "python" },
    { "type": "steps", "items": ["Шаг 1...", "Шаг 2..."] },
    { "type": "quote", "text": "..." }
  ],
  "keyTakeaways": ["...", "..."],
  "nextTopic": "что изучить дальше"
}
Правила:
- 8-14 блоков, логичный ритм: объяснение -> пример -> аналогия -> шаги.
- Текст блоков живой и понятный, без академической сухости.
- Для программирования включай блоки code.`

export async function generateLesson(topic: string, level?: string): Promise<Lesson> {
  const prompt = `Создай урок по теме: "${topic}"${level ? ` для уровня: ${level}` : ''}.
Сделай его по-настоящему интересным и понятным.`
  const raw = await complete(LESSON_SYSTEM, [{ role: 'user', content: prompt }], {
    temperature: 0.8,
    json: true,
  })
  return safeJsonParse<Lesson>(raw, {
    title: topic,
    emoji: '✨',
    summary: 'Урок по теме: ' + topic,
    durationMin: 10,
    difficulty: 'Средний',
    blocks: [
      { type: 'paragraph', text: raw.slice(0, 400) },
    ],
    keyTakeaways: [],
    nextTopic: topic,
  })
}

/* ===================== QUIZ GENERATION ===================== */

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: string // easy | medium | hard
}

const QUIZ_SYSTEM = `Ты — генератор адаптивных квизов.
Создавай квиз в СТРОГОМ JSON формате:
{
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": ["A","B","C","D"],
      "correctIndex": 0-3,
      "explanation": "почему правильный ответ именно такой, кратко",
      "difficulty": "easy|medium|hard"
    }
  ]
}
Правила:
- Ровно {N} вопросов.
- 4 варианта ответа, только один правильный.
- Вопросы проверяют понимание, а не зубрёжку.
- Объяснение к каждому ответу.
- Сложность прогрессирует: первые легче, последние сложнее.`

export async function generateQuiz(
  topic: string,
  count = 5,
  level?: string
): Promise<QuizQuestion[]> {
  const prompt = `Создай ${count} вопросов по теме "${topic}"${level ? `, уровень ${level}` : ''}.`
  const raw = await complete(QUIZ_SYSTEM.replace('{N}', String(count)), [
    { role: 'user', content: prompt },
  ], { temperature: 0.7, json: true })
  const parsed = safeJsonParse<{ questions: QuizQuestion[] }>(raw, { questions: [] })
  return parsed.questions ?? []
}

/* ===================== FLASHCARDS ===================== */

export interface FlashcardPair {
  front: string
  back: string
}

const FLASH_SYSTEM = `Ты — генератор флешкарт для интервального повторения.
Создавай карты в СТРОГОМ JSON формате:
{
  "cards": [
    { "front": "короткий вопрос/термин", "back": "чёткий ответ 1-2 предложения" }
  ]
}
Правила:
- {N} карт по теме.
- front — вопрос или термин (коротко).
- back — ответ ёмкий и точный.
- Покрывай ключевые концепции темы.`

export async function generateFlashcards(
  topic: string,
  count = 8
): Promise<FlashcardPair[]> {
  const prompt = `Создай ${count} флешкарт по теме "${topic}".`
  const raw = await complete(FLASH_SYSTEM.replace('{N}', String(count)), [
    { role: 'user', content: prompt },
  ], { temperature: 0.7, json: true })
  const parsed = safeJsonParse<{ cards: FlashcardPair[] }>(raw, { cards: [] })
  return parsed.cards ?? []
}

/* ===================== EXPLAIN (concept) ===================== */

const EXPLAIN_SYSTEM = `Ты — мастер простых объяснений. Объясни концепцию так,
чтобы понял подросток. Используй Markdown, аналогии, примеры из жизни.
Длина — 150-300 слов. Структура: краткое определение, аналогия, пример, почему это важно.`

export async function explainConcept(concept: string): Promise<string> {
  return complete(EXPLAIN_SYSTEM, [{ role: 'user', content: `Объясни: ${concept}` }], {
    temperature: 0.7,
  })
}

/* ===================== DAILY CHALLENGE ===================== */

export interface DailyChallenge {
  date: string
  subject: string
  emoji: string
  title: string
  prompt: string
  hint: string
  xpReward: number
}

const DAILY_SYSTEM = `Ты — генератор ежедневных интеллектуальных вызовов.
Верни ОДИН вызов в СТРОГОМ JSON формате:
{
  "subject": "название предмета",
  "emoji": "один эмодзи",
  "title": "короткое название вызова",
  "prompt": "что нужно сделать/решить/объяснить — 1-3 предложения",
  "hint": "подсказка, не дающая прямой ответ",
  "xpReward": 30
}
Вызовы должны быть разнообразными: задача, загадка, вопрос на размышление, творческое задание.
xpReward от 20 до 50.`

export async function generateDailyChallenge(seed: string): Promise<DailyChallenge> {
  const raw = await complete(DAILY_SYSTEM, [
    { role: 'user', content: `Сгенерируй вызов на сегодня (seed: ${seed}). Сделай его нестандартным и воодушевляющим.` },
  ], { temperature: 0.9, json: true })
  return safeJsonParse<DailyChallenge>(raw, {
    date: seed,
    subject: 'Любой',
    emoji: '🎯',
    title: 'Ежедневный вызов',
    prompt: 'Расскажи, что ты сегодня узнал нового.',
    hint: 'Подумай шире.',
    xpReward: 30,
  })
}

/* ===================== LEARNING PATHS ===================== */

export interface PathStep {
  title: string
  description: string
}

export interface LearningPath {
  goal: string
  emoji: string
  duration: string
  level: string
  steps: PathStep[]
}

const PATH_SYSTEM = `Ты — проектировщик образовательных маршрутов.
Создай персональный путь обучения в СТРОГОМ JSON формате:
{
  "goal": "главная цель",
  "emoji": "один эмодзи",
  "duration": "например: 4 недели",
  "level": "Новичок|Средний|Продвинутый",
  "steps": [
    { "title": "название этапа", "description": "что изучать и зачем" }
  ]
}
Правила:
- 6-10 шагов, от простого к сложному.
- Каждый шаг — конкретная тема с обоснованием.
- Реалистичная длительность.`

export async function generatePath(goal: string, level?: string): Promise<LearningPath> {
  const raw = await complete(PATH_SYSTEM, [
    { role: 'user', content: `Создай путь к цели: "${goal}"${level ? `, уровень: ${level}` : ''}.` },
  ], { temperature: 0.8, json: true })
  return safeJsonParse<LearningPath>(raw, {
    goal,
    emoji: '🧭',
    duration: 'гибко',
    level: level || 'Новичок',
    steps: [],
  })
}
