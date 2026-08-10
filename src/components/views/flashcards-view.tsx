'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Layers,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Loader2,
  Trash2,
  Check,
  Brain,
  Repeat,
  Zap,
  Clock,
} from 'lucide-react'
import { useNav, useUser } from '@/lib/store'
import { SUBJECTS, getSubject, localizeSubject } from '@/lib/subjects'
import {
  PageSection,
  SectionHeader,
  GlassCard,
  LoadingState,
  EmptyState,
  GradientButton,
  Pill,
} from '@/components/ui-blocks'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface FlashCard {
  id?: string
  subject?: string
  front: string
  back: string
  easeFactor?: number
  interval?: number
  repetitions?: number
  dueAt?: string | Date
}

type Quality = 'again' | 'hard' | 'good' | 'easy'
type Mode = 'generate' | 'review' | 'complete'
type SessionSource = 'due' | 'generated'

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const COUNTS = [5, 8, 12, 20] as const

const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

const SUGGESTED_TOPICS: { topic: LocalizedText; subject: string }[] = [
  { topic: localized('Замыкания в JavaScript', 'Closures in JavaScript', 'Փակումներ JavaScript-ում'), subject: 'programming' },
  { topic: localized('Теорема Пифагора', 'Pythagorean theorem', 'Պյութագորասի թեորեմ'), subject: 'math' },
  { topic: localized('Past Simple и Present Perfect', 'Past Simple vs Present Perfect', 'Past Simple և Present Perfect'), subject: 'languages' },
  { topic: localized('Законы Ньютона', "Newton's laws", 'Նյուտոնի օրենքներ'), subject: 'science' },
  { topic: localized('Стоицизм: основные принципы', 'Stoicism: core principles', 'Ստոիցիզմի հիմնական սկզբունքները'), subject: 'philosophy' },
  { topic: localized('Правило третей в композиции', 'The rule of thirds in composition', 'Երրորդների կանոնը կոմպոզիցիայում'), subject: 'art' },
  { topic: localized('Компоновка в Git', 'Rebasing in Git', 'Վերադասավորում Git-ում'), subject: 'programming' },
  { topic: localized('Древний Рим: республика', 'Ancient Rome: the Republic', 'Հին Հռոմ․ հանրապետություն'), subject: 'history' },
]

const QUALITY_BUTTONS: {
  quality: Quality
  label: LocalizedText
  key: string
  gradient: string
  ring: string
  glow: string
}[] = [
  {
    quality: 'again',
    label: localized('Снова', 'Again', 'Կրկին'),
    key: '1',
    gradient: 'from-rose-500/15 to-rose-600/5 hover:from-rose-500/35 hover:to-rose-600/15',
    ring: 'ring-rose-500/40 focus-visible:ring-rose-500',
    glow: 'shadow-rose-500/20 hover:shadow-rose-500/40',
  },
  {
    quality: 'hard',
    label: localized('Трудно', 'Hard', 'Դժվար'),
    key: '2',
    gradient: 'from-amber-500/15 to-amber-600/5 hover:from-amber-500/35 hover:to-amber-600/15',
    ring: 'ring-amber-500/40 focus-visible:ring-amber-500',
    glow: 'shadow-amber-500/20 hover:shadow-amber-500/40',
  },
  {
    quality: 'good',
    label: localized('Хорошо', 'Good', 'Լավ'),
    key: '3',
    gradient: 'from-emerald-500/15 to-emerald-600/5 hover:from-emerald-500/35 hover:to-emerald-600/15',
    ring: 'ring-emerald-500/40 focus-visible:ring-emerald-500',
    glow: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
  },
  {
    quality: 'easy',
    label: localized('Легко', 'Easy', 'Հեշտ'),
    key: '4',
    gradient: 'from-teal-500/15 to-teal-600/5 hover:from-teal-500/35 hover:to-teal-600/15',
    ring: 'ring-teal-500/40 focus-visible:ring-teal-500',
    glow: 'shadow-teal-500/20 hover:shadow-teal-500/40',
  },
]

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function FlashcardsView() {
  const { activeSubject } = useNav()
  const user = useUser()
  const { locale, tr, localize } = useTranslations()

  // Top-level mode
  const [mode, setMode] = useState<Mode>('generate')

  // Generate form state
  const [topic, setTopic] = useState('')
  const [subject, setSubjectLocal] = useState<string>(
    activeSubject && SUBJECTS.some((s) => s.id === activeSubject)
      ? activeSubject
      : 'programming'
  )
  const [count, setCount] = useState<number>(8)
  const [generating, setGenerating] = useState(false)

  // Due cards for the banner
  const [dueCards, setDueCards] = useState<FlashCard[]>([])
  const [loadingDue, setLoadingDue] = useState(true)

  // Review session state
  const [sessionCards, setSessionCards] = useState<FlashCard[]>([])
  const [sessionSource, setSessionSource] = useState<SessionSource | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(1)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Track latest submit to avoid stale closures in keyboard handler
  const submitRef = useRef<(q: Quality) => void>(() => {})
  const flipRef = useRef<() => void>(() => {})

  /* ----------------------------- effects --------------------------- */

  useEffect(() => {
    if (activeSubject && SUBJECTS.some((s) => s.id === activeSubject)) {
      setSubjectLocal(activeSubject)
    }
  }, [activeSubject])

  const fetchDue = useCallback(async () => {
    setLoadingDue(true)
    try {
      const res = await fetch('/api/flashcards?limit=50', { cache: 'no-store' })
      const data = await res.json()
      setDueCards(Array.isArray(data.cards) ? data.cards : [])
    } catch {
      setDueCards([])
    } finally {
      setLoadingDue(false)
    }
  }, [])

  useEffect(() => {
    fetchDue()
  }, [fetchDue])

  /* --------------------------- generate ---------------------------- */

  async function handleGenerate(givenTopic?: string) {
    const t = (givenTopic ?? topic).trim()
    if (!t) {
      toast.error(tr('Введи тему для карточек', 'Enter a flashcard topic', 'Մուտքագրիր քարտերի թեման'))
      return
    }
    setTopic(t)
    setGenerating(true)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t, subject, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || tr('Ошибка генерации', 'Generation failed', 'Ստեղծման սխալ'))
      if (!data.cards?.length) throw new Error(tr('Карты не сгенерированы', 'No flashcards were generated', 'Քարտեր չեն ստեղծվել'))

      useUser.setState({
        xp: typeof data.xp === 'number' ? data.xp : user.xp,
        level: typeof data.level === 'number' ? data.level : user.level,
      })

      toast.success(tr(`Создано ${data.cards.length} карточек!`, `${data.cards.length} flashcards created!`, `Ստեղծվել է ${data.cards.length} քարտ։`), {
        description: tr('Начинаем сессию повторения', 'Starting a review session', 'Սկսում ենք կրկնության փուլը'),
      })

      // The POST returns cards without ids. Refetch due list to get the
      // persisted versions (newly created cards default dueAt = now).
      const dueRes = await fetch('/api/flashcards?limit=50', { cache: 'no-store' })
      const dueData = await dueRes.json()
      const all: FlashCard[] = Array.isArray(dueData.cards) ? dueData.cards : []
      setDueCards(all)

      // Match persisted cards by front text to ensure ids are present.
      const generatedFronts = new Set(
        (data.cards as FlashCard[]).map((c) => c.front.trim())
      )
      let session: FlashCard[] = all.filter((c) =>
        generatedFronts.has((c.front || '').trim())
      )
      // Fallback: if matching failed for some reason, use the generated
      // payloads directly (PATCH will be skipped for cards without ids).
      if (session.length !== data.cards.length) {
        session = data.cards as FlashCard[]
      }

      startSession(session, 'generated')
    } catch (e) {
      console.error('[flashcards] generate', e)
      toast.error(tr('Не удалось создать карты. Попробуй ещё раз.', 'Could not create flashcards. Please try again.', 'Չհաջողվեց ստեղծել քարտերը։ Փորձիր կրկին։'))
    } finally {
      setGenerating(false)
    }
  }

  /* ---------------------------- session ---------------------------- */

  function startSession(cards: FlashCard[], source: SessionSource) {
    if (!cards.length) {
      toast.error(tr('Нет карточек для повторения', 'No flashcards are ready for review', 'Կրկնության համար քարտեր չկան'))
      return
    }
    setSessionCards(cards)
    setSessionSource(source)
    setCurrentIndex(0)
    setFlipped(false)
    setDirection(1)
    setReviewedCount(0)
    setXpGained(0)
    setSubmitting(false)
    setDeleting(false)
    setMode('review')
  }

  function startDueReview() {
    if (!dueCards.length) return
    startSession(dueCards, 'due')
  }

  function flip() {
    setFlipped((f) => !f)
  }
  flipRef.current = flip

  async function submitQuality(quality: Quality) {
    if (submitting || deleting) return
    const card = sessionCards[currentIndex]
    if (!card) return

    // No id (e.g. generated fallback) — just advance.
    if (!card.id) {
      setReviewedCount((v) => v + 1)
      advance()
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/flashcards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || tr('Ошибка', 'Error', 'Սխալ'))

      useUser.setState({
        xp: typeof data.xp === 'number' ? data.xp : user.xp,
        level: typeof data.level === 'number' ? data.level : user.level,
      })

      let gain = 0
      if (quality === 'easy') gain = 5
      else if (quality === 'good') gain = 3
      setXpGained((v) => v + gain)
      setReviewedCount((v) => v + 1)

      advance()
    } catch (e) {
      console.error('[flashcards] submit', e)
      toast.error(tr('Не удалось сохранить ответ', 'Could not save your answer', 'Չհաջողվեց պահպանել պատասխանը'))
    } finally {
      setSubmitting(false)
    }
  }
  submitRef.current = submitQuality

  function advance() {
    // Flip back first, then slide to next card.
    setFlipped(false)
    window.setTimeout(() => {
      if (currentIndex + 1 >= sessionCards.length) {
        setMode('complete')
        fetchDue()
      } else {
        setDirection(1)
        setCurrentIndex((i) => i + 1)
      }
    }, 220)
  }

  async function deleteCard() {
    const card = sessionCards[currentIndex]
    if (!card?.id || deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/flashcards/${card.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(tr('Не удалось удалить', 'Could not delete', 'Չհաջողվեց ջնջել'))
      toast.success(tr('Карточка удалена', 'Flashcard deleted', 'Քարտը ջնջված է'))
      // Remove from session without counting as reviewed.
      setSessionCards((prev) => {
        const next = prev.filter((_, i) => i !== currentIndex)
        if (next.length === 0) {
          setMode('complete')
          return []
        }
        // Stay on same index if possible, else clamp.
        if (currentIndex >= next.length) {
          setCurrentIndex(next.length - 1)
        }
        return next
      })
      setFlipped(false)
    } catch {
      toast.error(tr('Не удалось удалить карточку', 'Could not delete the flashcard', 'Չհաջողվեց ջնջել քարտը'))
    } finally {
      setDeleting(false)
    }
  }

  function exitSession() {
    setMode('generate')
    setSessionCards([])
    setFlipped(false)
    setSessionSource(null)
    fetchDue()
  }

  /* ------------------------- keyboard ------------------------------ */

  useEffect(() => {
    if (mode !== 'review') return
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (e.code === 'Space') {
        e.preventDefault()
        flipRef.current()
        return
      }
      if (e.key === '1') {
        e.preventDefault()
        submitRef.current('again')
      } else if (e.key === '2') {
        e.preventDefault()
        submitRef.current('hard')
      } else if (e.key === '3') {
        e.preventDefault()
        submitRef.current('good')
      } else if (e.key === '4') {
        e.preventDefault()
        submitRef.current('easy')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  /* --------------------------- render ------------------------------ */

  if (mode === 'review') {
    return (
      <ReviewSession
        cards={sessionCards}
        index={currentIndex}
        flipped={flipped}
        direction={direction}
        source={sessionSource}
        submitting={submitting}
        deleting={deleting}
        onFlip={flip}
        onQuality={submitQuality}
        onDelete={deleteCard}
        onExit={exitSession}
      />
    )
  }

  if (mode === 'complete') {
    return (
      <CompleteScreen
        reviewedCount={reviewedCount}
        totalCards={sessionCards.length || reviewedCount}
        xpGained={xpGained}
        onBack={exitSession}
      />
    )
  }

  return (
    <PageSection className="py-8">
      <SectionHeader
        title={tr('Флешкарты', 'Flashcards', 'Ուսուցման քարտեր')}
        subtitle={tr('Запоминай надолго с интервальным повторением', 'Remember for longer with spaced repetition', 'Երկար հիշիր պարբերական կրկնության միջոցով')}
        icon={Layers}
        action={
          <Pill className="hidden sm:inline-flex border-primary/30 bg-primary/10 text-primary">
            <Zap className="h-3 w-3" />
            {tr('SM-2 алгоритм', 'SM-2 algorithm', 'SM-2 ալգորիթմ')}
          </Pill>
        }
      />

      {/* Due-for-review banner */}
      <AnimatePresence>
        {!loadingDue && dueCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6"
          >
            <GlassCard
              gradient
              hover={false}
              className="overflow-hidden border-primary/30"
            >
              <div className="relative flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                <div className="relative flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30">
                    <Repeat className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">
                      {tr('У тебя', 'You have', 'Դու ունես')}{' '}
                      <span className="text-gradient">{dueCards.length}</span>{' '}
                      {pluralizeCards(dueCards.length, locale)} {tr('на повторение', 'to review', 'կրկնելու համար')}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {tr('Самое время освежить память — это занимает пару минут', 'A quick review will refresh your memory in just a few minutes', 'Ժամանակն է թարմացնել հիշողությունը․ դա կտևի ընդամենը մի քանի րոպե')}
                    </p>
                  </div>
                </div>
                <GradientButton onClick={startDueReview} className="shrink-0">
                  <RotateCcw className="h-4 w-4" />
                  {tr('Повторить', 'Review', 'Կրկնել')}
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate form */}
      <GlassCard className="mb-6 overflow-hidden" hover={false}>
        <div className="relative border-b border-border/60 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
          <div className="relative">
            <label
              htmlFor="flash-topic"
              className="mb-2 block text-sm font-medium"
            >
              {tr('Какую тему закрепляем?', 'Which topic should we reinforce?', 'Ո՞ր թեման ամրապնդենք')}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="flash-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !generating) handleGenerate()
                }}
                placeholder={tr('Например: бинарный поиск, неправильные глаголы, клеточное дыхание...', 'For example: binary search, irregular verbs, cellular respiration...', 'Օրինակ՝ երկակի որոնում, անկանոն բայեր, բջջային շնչառություն...')}
                className="flex-1 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none ring-primary/20 transition placeholder:text-muted-foreground/60 focus:ring-2"
              />
              <GradientButton
                onClick={() => handleGenerate()}
                disabled={generating}
                className="shrink-0 px-6"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tr('Создаю...', 'Creating...', 'Ստեղծում ենք...')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {tr('Создать карты', 'Create flashcards', 'Ստեղծել քարտեր')}
                  </>
                )}
              </GradientButton>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Subject chips */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tr('Предмет', 'Subject', 'Առարկա')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => {
                const active = s.id === subject
                return (
                  <button
                    key={s.id}
                    onClick={() => setSubjectLocal(s.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? `border-transparent bg-gradient-to-r ${s.gradient} text-white shadow-md`
                        : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <span>{s.emoji}</span>
                    {localizeSubject(s, locale).name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Count selector */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tr('Сколько карточек', 'Number of flashcards', 'Քարտերի քանակ')}
            </p>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((c) => {
                const active = c === count
                return (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={`inline-flex h-9 w-12 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                      active
                        ? 'border-primary/60 bg-primary/15 text-primary ring-1 ring-primary/40'
                        : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Suggested topics */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tr('Идеи тем', 'Topic ideas', 'Թեմաների գաղափարներ')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map((sug) => {
                const subj = getSubject(sug.subject)
                const topicText = localize(sug.topic)
                return (
                  <button
                    key={topicText}
                    onClick={() => {
                      setSubjectLocal(sug.subject)
                      handleGenerate(topicText)
                    }}
                    disabled={generating}
                    className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                  >
                    {subj && <span>{subj.emoji}</span>}
                    {topicText}
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Empty hint / loading */}
      {loadingDue ? (
        <LoadingState label={tr('Проверяю карточки на повторение...', 'Checking cards due for review...', 'Ստուգում ենք կրկնության ենթակա քարտերը...')} />
      ) : dueCards.length === 0 ? (
        <EmptyState
          icon={Brain}
          title={tr('Здесь появятся твои карточки', 'Your flashcards will appear here', 'Քո քարտերը կհայտնվեն այստեղ')}
          description={tr('Создай первую партию — выбери тему выше или подскажи идею. AI сгенерирует карточки, а ты закрепишь их методом интервального повторения.', 'Create your first set by choosing a topic above. AI will generate the cards and spaced repetition will help you remember them.', 'Ստեղծիր առաջին հավաքածուն՝ ընտրելով թեմա։ AI-ը կստեղծի քարտերը, իսկ պարբերական կրկնությունը կօգնի հիշել դրանք։')}
        />
      ) : null}

      {/* How it works */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Sparkles,
            title: tr('1. Создай', '1. Create', '1. Ստեղծիր'),
            desc: tr('Введи тему — AI сгенерирует карточки с вопросами и ответами.', 'Enter a topic and AI will generate question-and-answer cards.', 'Մուտքագրիր թեման, և AI-ը կստեղծի հարց ու պատասխան քարտեր։'),
          },
          {
            icon: RotateCcw,
            title: tr('2. Повторяй', '2. Review', '2. Կրկնիր'),
            desc: tr('Переворачивай карточку и оценивай, насколько легко вспомнил.', 'Flip each card and rate how easily you remembered it.', 'Շրջիր յուրաքանչյուր քարտը և գնահատիր՝ որքան հեշտ հիշեցիր։'),
          },
          {
            icon: Brain,
            title: tr('3. Запоминай', '3. Remember', '3. Հիշիր'),
            desc: tr('Алгоритм SM-2 вернётся к карточкам ровно когда нужно.', 'The SM-2 algorithm brings cards back at the right time.', 'SM-2 ալգորիթմը քարտերը կվերադարձնի ճիշտ ժամանակին։'),
          },
        ].map((step) => (
          <GlassCard key={step.title} className="p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary ring-1 ring-primary/20">
              <step.icon className="h-5 w-5" />
            </div>
            <p className="font-semibold">{step.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
          </GlassCard>
        ))}
      </div>
    </PageSection>
  )
}

/* ------------------------------------------------------------------ */
/* Review session                                                      */
/* ------------------------------------------------------------------ */

function ReviewSession({
  cards,
  index,
  flipped,
  direction,
  source,
  submitting,
  deleting,
  onFlip,
  onQuality,
  onDelete,
  onExit,
}: {
  cards: FlashCard[]
  index: number
  flipped: boolean
  direction: number
  source: SessionSource | null
  submitting: boolean
  deleting: boolean
  onFlip: () => void
  onQuality: (q: Quality) => void
  onDelete: () => void
  onExit: () => void
}) {
  const { locale, tr, localize } = useTranslations()
  const card = cards[index]
  const total = cards.length
  const subjectInfo = card?.subject ? getSubject(card.subject) : undefined

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.96,
    }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.96,
    }),
  }

  return (
    <PageSection className="py-6 sm:py-8">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          {tr('Выйти', 'Exit', 'Դուրս գալ')}
        </button>
        <div className="flex items-center gap-3">
          {source === 'due' ? (
            <Pill className="border-primary/30 bg-primary/10 text-primary">
              <Repeat className="h-3 w-3" /> {tr('Повторение', 'Review', 'Կրկնություն')}
            </Pill>
          ) : source === 'generated' ? (
            <Pill className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300">
              <Sparkles className="h-3 w-3" /> {tr('Новые', 'New', 'Նոր')}
            </Pill>
          ) : null}
          <span className="text-sm font-semibold tabular-nums">
            <span className="text-gradient">{index + 1}</span>
            <span className="text-muted-foreground"> / {total}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* Card */}
      <div className="mx-auto max-w-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ perspective: 1400 }}
          >
            <motion.div
              onClick={onFlip}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0.0, 0.2, 1] }}
              style={{
                transformStyle: 'preserve-3d',
                position: 'relative',
                minHeight: 320,
                cursor: 'pointer',
              }}
              className="group select-none"
            >
              {/* FRONT — question / term */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  position: 'absolute',
                  inset: 0,
                }}
              >
                <GlassCard
                  hover={false}
                  gradient
                  className="flex h-full min-h-[320px] flex-col overflow-hidden"
                >
                  <div className="relative flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-12">
                    <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.06]" />
                    <div className="relative mb-5">
                      <Pill className="border-border/60 bg-background/40 text-muted-foreground">
                        <Brain className="h-3 w-3" />
                        {tr('Вопрос', 'Question', 'Հարց')}
                      </Pill>
                    </div>
                    <p className="relative max-w-xl text-balance text-2xl font-bold leading-snug sm:text-3xl">
                      {card?.front}
                    </p>
                    <div className="relative mt-8 flex items-center gap-2 text-xs text-muted-foreground/80">
                      <RotateCcw className="h-3.5 w-3.5" />
                      {tr('Нажми или пробел, чтобы перевернуть', 'Click or press Space to flip', 'Սեղմիր կամ օգտագործիր Space՝ շրջելու համար')}
                    </div>
                  </div>

                  {/* Card footer — subject + delete */}
                  <div className="relative flex items-center justify-between border-t border-border/60 bg-background/40 px-5 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {subjectInfo && (
                        <>
                          <span>{subjectInfo.emoji}</span>
                          <span>{localizeSubject(subjectInfo, locale).name}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                      }}
                      disabled={deleting || !card?.id}
                      title={tr('Удалить карточку', 'Delete flashcard', 'Ջնջել քարտը')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </GlassCard>
              </div>

              {/* BACK — answer */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: 'absolute',
                  inset: 0,
                }}
              >
                <div
                  className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-fuchsia-500/40 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/25 to-pink-600/30 backdrop-blur-xl"
                >
                  <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
                  <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.06]" />

                  <div className="relative flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-12">
                    <div className="mb-5">
                      <Pill className="border-white/20 bg-white/10 text-white">
                        <Check className="h-3 w-3" />
                        {tr('Ответ', 'Answer', 'Պատասխան')}
                      </Pill>
                    </div>
                    <p className="max-w-xl text-balance text-xl font-semibold leading-relaxed text-white sm:text-2xl">
                      {card?.back}
                    </p>
                  </div>

                  <div className="relative flex items-center justify-between border-t border-white/10 bg-black/20 px-5 py-3">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      {subjectInfo && (
                        <>
                          <span>{subjectInfo.emoji}</span>
                          <span>{localizeSubject(subjectInfo, locale).name}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                      }}
                      disabled={deleting || !card?.id}
                      title={tr('Удалить карточку', 'Delete flashcard', 'Ջնջել քարտը')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Quality buttons — visible only after flip */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="mt-6"
            >
              <p className="mb-3 text-center text-sm text-muted-foreground">
                {tr('Как легко было вспомнить?', 'How easy was it to remember?', 'Որքա՞ն հեշտ էր հիշել')}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {QUALITY_BUTTONS.map((b) => (
                  <button
                    key={b.quality}
                    onClick={() => onQuality(b.quality)}
                    disabled={submitting}
                    className={`group relative flex flex-col items-center gap-1 rounded-xl border bg-gradient-to-br ${b.gradient} ${b.ring} px-3 py-3.5 text-sm font-semibold shadow-lg ${b.glow} transition-all hover:scale-[1.03] hover:shadow-xl focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="text-xs font-medium">{localize(b.label)}</span>
                    <kbd className="rounded bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {b.key}
                    </kbd>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard hint */}
        {!flipped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <kbd className="rounded border border-border/60 bg-muted/40 px-2 py-1">
              Space
            </kbd>
            <span>{tr('перевернуть', 'flip', 'շրջել')} ·</span>
            <kbd className="rounded border border-border/60 bg-muted/40 px-2 py-1">
              1–4
            </kbd>
            <span>{tr('оценить', 'rate', 'գնահատել')}</span>
          </motion.div>
        )}
      </div>
    </PageSection>
  )
}

/* ------------------------------------------------------------------ */
/* Completion screen                                                   */
/* ------------------------------------------------------------------ */

function CompleteScreen({
  reviewedCount,
  totalCards,
  xpGained,
  onBack,
}: {
  reviewedCount: number
  totalCards: number
  xpGained: number
  onBack: () => void
}) {
  const { tr } = useTranslations()
  return (
    <PageSection className="flex min-h-[70vh] items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <GlassCard gradient hover={false} className="overflow-hidden">
          <div className="relative flex flex-col items-center p-8 text-center sm:p-10">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/30 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />

            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.1, type: 'spring' }}
              className="relative mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-2xl shadow-fuchsia-500/40"
            >
              <Check className="h-10 w-10" strokeWidth={3} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative text-3xl font-extrabold tracking-tight"
            >
              {tr('Сессия', 'Session', 'Փուլը')} <span className="text-gradient">{tr('завершена!', 'complete!', 'ավարտված է։')}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="relative mt-2 text-sm text-muted-foreground"
            >
              {tr(`Ты повторил ${reviewedCount} из ${totalCards} карточек`, `You reviewed ${reviewedCount} of ${totalCards} flashcards`, `Դու կրկնեցիր ${totalCards}-ից ${reviewedCount} քարտ`)}
            </motion.p>

            {/* Stats */}
            <div className="relative mt-8 grid w-full grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                <div className="mb-1 flex items-center justify-center text-muted-foreground">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {reviewedCount}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tr('Повторено', 'Reviewed', 'Կրկնված')}
                </div>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-1 flex items-center justify-center text-primary">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold tabular-nums text-gradient">
                  +{xpGained}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {tr('Опыт', 'Experience', 'Փորձ')}
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative mt-8 flex w-full flex-col gap-2 sm:flex-row"
            >
              <GradientButton onClick={onBack} className="w-full">
                <RotateCcw className="h-4 w-4" />
                {tr('Создать ещё', 'Create more', 'Ստեղծել ավելին')}
              </GradientButton>
              <button
                onClick={onBack}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-accent"
              >
                <Clock className="h-4 w-4" />
                {tr('На главную', 'Back to start', 'Վերադառնալ սկզբին')}
              </button>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>
    </PageSection>
  )
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function pluralizeCards(n: number, locale: 'ru' | 'en' | 'hy'): string {
  if (locale === 'en') return n === 1 ? 'flashcard' : 'flashcards'
  if (locale === 'hy') return 'քարտ'
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'карточка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return 'карточки'
  return 'карточек'
}
