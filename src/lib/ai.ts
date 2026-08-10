import { LANGUAGE_INSTRUCTIONS } from '@/lib/i18n-config'
import { getRequestLocale } from '@/lib/locale-server'

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NEMOTRON_MODEL = 'nvidia/nemotron-3-super-120b-a12b'
const ARMENIAN_TRANSLATOR_MODEL = 'openai/gpt-oss-120b'

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
  model?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

async function nvidiaCompletion(
  messages: CompletionMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const model = options.model ?? NEMOTRON_MODEL
  const isArmenianTranslator = model === ARMENIAN_TRANSLATOR_MODEL
  const baseUrl = (process.env.NVIDIA_BASE_URL || NVIDIA_BASE_URL).replace(/\/$/, '')
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    throw new AIServiceError('AI_KEY_MISSING', 'NVIDIA_API_KEY is required')
  }
  let response: Response
  let responseBody: string
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 1,
        top_p: isArmenianTranslator ? 1 : 0.95,
        max_tokens: options.maxTokens ?? 4096,
        reasoning_effort: isArmenianTranslator ? 'low' : 'none',
        stream: false,
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 90_000),
    })
    responseBody = await response.text()
  } catch (error) {
    const errorName = error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : ''
    if (errorName === 'TimeoutError' || errorName === 'AbortError') {
      throw new AIServiceError('AI_TIMEOUT', 'NVIDIA API request timed out')
    }
    throw new AIServiceError('AI_PROVIDER_ERROR', 'Could not reach NVIDIA API')
  }
  if (!response.ok) {
    const details = responseBody.slice(0, 500)
    const code: AIErrorCode =
      response.status === 401 || response.status === 403
        ? 'AI_UNAUTHORIZED'
        : response.status === 429
          ? 'AI_RATE_LIMITED'
          : response.status === 400 || response.status === 404 || response.status === 422
            ? 'AI_REQUEST_INVALID'
            : 'AI_PROVIDER_ERROR'
    throw new AIServiceError(code, `NVIDIA model ${model} returned ${response.status}: ${details}`)
  }
  let payload: {
    choices?: Array<{ message?: { content?: string } }>
  }
  try {
    payload = JSON.parse(responseBody) as typeof payload
  } catch {
    throw new AIServiceError('AI_PROVIDER_ERROR', 'NVIDIA API returned invalid JSON')
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
  const locale = await getRequestLocale()
  const targetLanguageInstruction = LANGUAGE_INSTRUCTIONS[locale]
  const needsArmenianTranslation = locale === 'hy'
  const generationLanguageInstruction = needsArmenianTranslation
    ? `${LANGUAGE_INSTRUCTIONS.en} This is the source draft for a separate Armenian translator, so do not translate it into Armenian.`
    : targetLanguageInstruction
  const outputLanguageRule = `OUTPUT LANGUAGE — HIGHEST PRIORITY:
${generationLanguageInstruction}
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
  const completionDeadline = Date.now() + 280_000
  const remainingTimeout = (maximum: number) =>
    Math.max(1_000, Math.min(maximum, completionDeadline - Date.now()))
  try {
    let content = await nvidiaCompletion(messagesWithSystem, {
      temperature: opts.temperature,
      maxTokens: opts.json ? 3072 : 4096,
      timeoutMs: remainingTimeout(needsArmenianTranslation ? 105_000 : 120_000),
    })
    if (opts.json) {
      content = extractJson(content)
    }

    const invalidJson = Boolean(opts.json) && tryJsonParse(content) === null
    if (locale === 'hy') {
      const sourceContent = content
      const translationFormatRule = opts.json
        ? `Return exactly one valid JSON value and nothing else. Preserve every property name, array, number, boolean, ID, type value, code block, programming-language name, formula, URL, and emoji. Translate only natural-language string values. Preserve the values easy, medium, and hard when they are structural quiz difficulty values.`
        : `Preserve Markdown structure, code fences, inline code, formulas, URLs, and proper names. Return only the translated content with no introduction or notes.`
      const translationMessages: CompletionMessage[] = [
        {
          role: 'system',
          content: `You are a professional translator and editor specializing in modern literary Eastern Armenian. Translate the complete source into fluent Eastern Armenian written in the Armenian alphabet. Use standard Armenian educational terminology and natural grammar. Do not leave Russian, Persian, Arabic, English, or Latin-transliterated prose. Latin characters may remain only in code, formulas, SI units, URLs, IDs, and proper names with no standard Armenian form. Preserve all facts and meaning. Never shorten, summarize, omit, or add content.\n\n${translationFormatRule}`,
        },
        {
          role: 'user',
          content: `${opts.json ? `Required JSON schema and content rules:\n${system}\n\n` : ''}Translate this complete Nemotron source into Armenian${invalidJson ? ' and repair its JSON syntax' : ''}:\n${sourceContent}`,
        },
      ]
      let translatorModel = ARMENIAN_TRANSLATOR_MODEL
      try {
        content = await nvidiaCompletion(translationMessages, {
          model: translatorModel,
          temperature: 1,
          maxTokens: 4096,
          timeoutMs: remainingTimeout(150_000),
        })
      } catch (error) {
        if (!(error instanceof AIServiceError)) throw error
        if (error.code === 'AI_TIMEOUT') throw error
        console.warn(
          `[ai.complete] GPT-OSS Armenian translator unavailable (${error.code}); using Nemotron fallback`
        )
        translatorModel = NEMOTRON_MODEL
        content = await nvidiaCompletion(translationMessages, {
          model: translatorModel,
          temperature: 0.7,
          maxTokens: 4096,
          timeoutMs: remainingTimeout(90_000),
        })
      }
      if (opts.json) content = extractJson(content)

      const translatedInvalidJson = Boolean(opts.json) && tryJsonParse(content) === null
      const translatedLanguageLeak = hasArmenianLanguageLeak(content, Boolean(opts.json))
      const remaining = completionDeadline - Date.now()
      if (remaining >= 20_000) {
        try {
          let editedContent = await nvidiaCompletion([
            {
              role: 'system',
              content: `You are the final Eastern Armenian quality editor. Return only the corrected ${opts.json ? 'valid JSON' : 'content'}. Use the original English source to restore accurate meaning. Keep structure, keys, facts, code, formulas, URLs, IDs, and emojis unchanged. Rewrite every natural-language phrase in clear, fluent, native Eastern Armenian using Armenian letters. Correct mistranslated or invented Armenian words and unnatural grammar. Remove every foreign-script and transliterated prose fragment.${translatedInvalidJson ? ' Repair the JSON syntax.' : ''}${translatedLanguageLeak ? ' Automated validation detected foreign-language leakage.' : ''}`,
            },
            {
              role: 'user',
              content: `Original English source:\n${sourceContent}\n\nDraft Armenian translation to edit:\n${content}`,
            },
          ], {
            model: NEMOTRON_MODEL,
            temperature: 0.2,
            maxTokens: 4096,
            timeoutMs: remainingTimeout(90_000),
          })
          if (opts.json) editedContent = extractJson(editedContent)
          if (!opts.json || tryJsonParse(editedContent) !== null) content = editedContent
        } catch (error) {
          if (!(error instanceof AIServiceError)) throw error
          console.warn(`[ai.complete] Armenian final edit unavailable (${error.code}); using GPT-OSS translation`)
        }
      }
    } else if (invalidJson) {
      if (opts.json) {
        const repairMessages: CompletionMessage[] = [
          {
            role: 'system',
            content: `You are a strict JSON repair engine. Return exactly one valid JSON value and nothing else. Preserve the intended data, satisfy the requested schema, and keep every natural-language string in the required output language. Never use Markdown fences, comments, ellipses, or trailing commas.\n\n${outputLanguageRule}`,
          },
          {
            role: 'user',
            content: `Required schema and content rules:\n${system}\n\nThe response failed JSON syntax validation. Repair it completely:\n${content}`,
          },
        ]
        content = extractJson(await nvidiaCompletion(repairMessages, {
          temperature: 0.2,
          maxTokens: 4096,
          timeoutMs: remainingTimeout(60_000),
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

const JSON_TECHNICAL_KEYS = new Set(['code', 'lang', 'id', 'type'])

function jsonStringsContainLatinWords(value: unknown, key?: string): boolean {
  if (key && JSON_TECHNICAL_KEYS.has(key)) return false
  if (typeof value === 'string') return /[A-Za-z]{2,}/.test(value)
  if (Array.isArray(value)) return value.some((item) => jsonStringsContainLatinWords(item, key))
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([childKey, child]) =>
      jsonStringsContainLatinWords(child, childKey)
    )
  }
  return false
}

function hasArmenianLanguageLeak(text: string, json: boolean): boolean {
  if (/[\u0400-\u052F\u0600-\u06FF]/u.test(text)) return true
  if (json) {
    const value = tryJsonParse(text)
    return value !== null && jsonStringsContainLatinWords(value)
  }
  const prose = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
  return /[A-Za-z]{2,}/.test(prose)
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
