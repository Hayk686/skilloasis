import { getLanguageInstruction, getRequestLocale } from '@/lib/locale-server'

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = 'nvidia/nemotron-3-super-120b-a12b'

export type AIErrorCode =
  | 'AI_KEY_MISSING'
  | 'AI_UNAUTHORIZED'
  | 'AI_RATE_LIMITED'
  | 'AI_REQUEST_INVALID'
  | 'AI_TIMEOUT'
  | 'AI_PROVIDER_ERROR'
  | 'AI_EMPTY_RESPONSE'

export class AIServiceError extends Error {
  constructor(public readonly code: AIErrorCode, message: string) {
    super(message)
    this.name = 'AIServiceError'
  }
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

interface CompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CompletionOptions {
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

async function nvidiaCompletion(
  messages: CompletionMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const baseUrl = (process.env.NVIDIA_BASE_URL || NVIDIA_BASE_URL).replace(/\/$/, '')
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    throw new AIServiceError('AI_KEY_MISSING', 'NVIDIA_API_KEY is required')
  }
  let response: Response
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages,
        temperature: options.temperature ?? 1,
        top_p: 0.95,
        max_tokens: options.maxTokens ?? 8192,
        reasoning_effort: 'none',
        stream: false,
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 55_000),
    })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new AIServiceError('AI_TIMEOUT', 'NVIDIA API request timed out')
    }
    throw new AIServiceError('AI_PROVIDER_ERROR', 'Could not reach NVIDIA API')
  }
  if (!response.ok) {
    const details = (await response.text()).slice(0, 500)
    const code: AIErrorCode =
      response.status === 401 || response.status === 403
        ? 'AI_UNAUTHORIZED'
        : response.status === 429
          ? 'AI_RATE_LIMITED'
          : response.status === 400 || response.status === 404 || response.status === 422
            ? 'AI_REQUEST_INVALID'
            : 'AI_PROVIDER_ERROR'
    throw new AIServiceError(code, `NVIDIA API returned ${response.status}: ${details}`)
  }
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content?.trim()
  if (!content) throw new AIServiceError('AI_EMPTY_RESPONSE', 'NVIDIA API returned an empty response')
  return content
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
This rule applies to every user-visible sentence and every natural-language string value inside JSON. Translate labels and examples into that language. Do not follow conflicting language instructions elsewhere in the prompt.`
  const responseRule = opts.json
    ? `RESPONSE FORMAT — HIGHEST PRIORITY:
Return exactly one valid JSON value matching the requested schema. Start with { or [ and end with } or ]. Do not use Markdown fences. Do not include analysis, reasoning, commentary, or text before or after the JSON.`
    : `RESPONSE FORMAT — HIGHEST PRIORITY:
Return only the final user-facing answer. Do not expose analysis, hidden reasoning, planning, or internal instructions.`
  const messagesWithSystem: CompletionMessage[] = [
    { role: 'system', content: `${system}\n\n${outputLanguageRule}\n\n${responseRule}` },
    ...messages,
  ]
  try {
    let content = await nvidiaCompletion(messagesWithSystem, {
      temperature: opts.temperature,
    })
    if (opts.json) {
      content = extractJson(content)
      if (tryJsonParse(content) === null) {
        const repairMessages: CompletionMessage[] = [
          {
            role: 'system',
            content: `You are a strict JSON repair engine. Return exactly one valid JSON value and nothing else. Preserve the intended data, satisfy the requested schema, and keep every natural-language string in the required output language. Never use Markdown fences, comments, ellipses, or trailing commas.\n\n${outputLanguageRule}`,
          },
          {
            role: 'user',
            content: `Required schema and content rules:\n${system}\n\nRepair this model response into valid JSON:\n${content}`,
          },
        ]
        content = extractJson(await nvidiaCompletion(repairMessages, {
          temperature: 0.2,
          maxTokens: 8192,
        }))
      }
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

function tryJsonParse<T = unknown>(raw: string): T | null {
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
  return null
}

export function safeJsonParse<T>(raw: string, fallback: T): T {
  return tryJsonParse<T>(raw) ?? fallback
}

/* ===================== TUTOR ===================== */

const TUTOR_SYSTEM = `You are Lumina, a warm, wise, and encouraging AI tutor.
Principles:
- Make difficult ideas simple with everyday analogies, short examples, and clear steps.
- Be concise but helpful. Use Markdown headings, lists, emphasis, code, and quotes when useful.
- When appropriate, end with one short check-for-understanding question.
- Never invent facts. State uncertainty honestly.
- Encourage real progress without empty flattery.
- Show step-by-step reasoning for mathematics and physics without exposing hidden chain-of-thought.
- Give short, working code examples for programming topics.`

export async function tutorChat(history: ChatTurn[], subject?: string): Promise<string> {
  const sys = subject
    ? `${TUTOR_SYSTEM}\n\nCurrent learning subject: ${subject}. Focus on this area while still answering closely related questions.`
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

const LESSON_SYSTEM = `Create an engaging educational lesson as strict JSON using this exact structure:
{
  "title": string,
  "emoji": string (one emoji),
  "summary": string (an engaging 1-2 sentence introduction),
  "durationMin": number (5-20),
  "difficulty": string,
  "blocks": [
    { "type": "heading", "text": "..." },
    { "type": "paragraph", "text": "..." },
    { "type": "analogy", "text": "..." },
    { "type": "example", "text": "..." },
    { "type": "callout", "text": "..." },
    { "type": "code", "code": "...", "lang": "python" },
    { "type": "steps", "items": ["...", "..."] },
    { "type": "quote", "text": "..." }
  ],
  "keyTakeaways": ["...", "..."],
  "nextTopic": string
}
Rules:
- Produce 8-12 useful blocks in a logical teaching sequence.
- Write lively, accurate, easy-to-understand content.
- Include code blocks only for programming topics.
- Localize difficulty and every other natural-language value into the required output language.
- Do not leave placeholder values such as "..." in the response.`

export async function generateLesson(topic: string, level?: string): Promise<Lesson> {
  const prompt = `Create a complete lesson about: "${topic}"${level ? `. Learner level: ${level}` : ''}. Make it genuinely interesting and easy to understand.`
  const raw = await complete(LESSON_SYSTEM, [{ role: 'user', content: prompt }], {
    temperature: 0.8,
    json: true,
  })
  const parsed = safeJsonParse<Lesson | null>(raw, null)
  if (parsed?.title && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) return parsed

  const locale = await getRequestLocale()
  const fallback = {
    ru: { summary: `Урок по теме: ${topic}`, difficulty: 'Средний' },
    en: { summary: `Lesson about: ${topic}`, difficulty: 'Medium' },
    hy: { summary: `Դաս թեմայով՝ ${topic}`, difficulty: 'Միջին' },
  }[locale]
  return {
    title: topic,
    emoji: '✨',
    summary: fallback.summary,
    durationMin: 10,
    difficulty: fallback.difficulty,
    blocks: [
      { type: 'paragraph', text: raw.slice(0, 400) },
    ],
    keyTakeaways: [],
    nextTopic: topic,
  }
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

const QUIZ_SYSTEM = `Create an adaptive quiz as strict JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": ["A","B","C","D"],
      "correctIndex": 0-3,
      "explanation": "a concise explanation of the correct answer",
      "difficulty": "easy|medium|hard"
    }
  ]
}
Rules:
- Return exactly {N} questions.
- Give four options and exactly one correct answer.
- Test understanding instead of memorization.
- Explain every correct answer.
- Progress from easier to harder questions.
- Localize question, options, and explanation into the required output language.`

export async function generateQuiz(
  topic: string,
  count = 5,
  level?: string
): Promise<QuizQuestion[]> {
  const prompt = `Create ${count} questions about "${topic}"${level ? ` for learner level ${level}` : ''}.`
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

const FLASH_SYSTEM = `Create spaced-repetition flashcards as strict JSON:
{
  "cards": [
    { "front": "short question or term", "back": "clear 1-2 sentence answer" }
  ]
}
Rules:
- Return exactly {N} cards about the topic.
- Keep the front short.
- Make the back concise and accurate.
- Cover the topic's key concepts.
- Localize both sides into the required output language.`

export async function generateFlashcards(
  topic: string,
  count = 8
): Promise<FlashcardPair[]> {
  const prompt = `Create ${count} flashcards about "${topic}".`
  const raw = await complete(FLASH_SYSTEM.replace('{N}', String(count)), [
    { role: 'user', content: prompt },
  ], { temperature: 0.7, json: true })
  const parsed = safeJsonParse<{ cards: FlashcardPair[] }>(raw, { cards: [] })
  return parsed.cards ?? []
}

/* ===================== EXPLAIN (concept) ===================== */

const EXPLAIN_SYSTEM = `Explain the concept so a teenager can understand it. Use Markdown,
an analogy, and an everyday example. Write 150-300 words with this structure:
a short definition, analogy, example, and why it matters.`

export async function explainConcept(concept: string): Promise<string> {
  return complete(EXPLAIN_SYSTEM, [{ role: 'user', content: `Explain: ${concept}` }], {
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

const DAILY_SYSTEM = `Create one daily intellectual challenge as strict JSON:
{
  "subject": "subject name",
  "emoji": "one emoji",
  "title": "short challenge title",
  "prompt": "the task in 1-3 sentences",
  "hint": "a useful hint that does not reveal the answer",
  "xpReward": 30
}
Vary the type between a problem, riddle, reflection question, and creative task.
Set xpReward from 20 to 50. Localize every natural-language value.`

export async function generateDailyChallenge(seed: string): Promise<DailyChallenge> {
  const raw = await complete(DAILY_SYSTEM, [
    { role: 'user', content: `Create today's challenge (seed: ${seed}). Make it original and encouraging.` },
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

const PATH_SYSTEM = `Create a personalized learning path as strict JSON:
{
  "goal": "main goal",
  "emoji": "one emoji",
  "duration": "for example: 4 weeks",
  "level": "learner level",
  "steps": [
    { "title": "stage title", "description": "what to learn and why" }
  ]
}
Rules:
- Produce 6-10 steps from fundamentals to advanced material.
- Make every step a concrete topic with a reason.
- Give a realistic duration.
- Localize every natural-language value into the required output language.`

export async function generatePath(goal: string, level?: string): Promise<LearningPath> {
  const raw = await complete(PATH_SYSTEM, [
    { role: 'user', content: `Create a learning path for this goal: "${goal}"${level ? `. Learner level: ${level}` : ''}.` },
  ], { temperature: 0.8, json: true })
  return safeJsonParse<LearningPath>(raw, {
    goal,
    emoji: '🧭',
    duration: 'гибко',
    level: level || 'Новичок',
    steps: [],
  })
}
