'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import {
  BookOpen,
  Sparkles,
  Clock,
  Gauge,
  Lightbulb,
  FlaskConical,
  AlertCircle,
  Quote,
  ListOrdered,
  Code2,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ChevronRight,
  Bookmark,
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
  StaggerGroup,
  StaggerItem,
} from '@/components/ui-blocks'
import { AudioNarration } from '@/components/media-tools'
import { BookmarkButton } from '@/components/bookmark-button'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

/* ===================== Types ===================== */

type LessonBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'analogy'; text: string }
  | { type: 'example'; text: string }
  | { type: 'callout'; text: string }
  | { type: 'code'; code: string; lang?: string }
  | { type: 'steps'; items: string[] }
  | { type: 'quote'; text: string }

interface Lesson {
  title: string
  emoji: string
  summary: string
  durationMin: number
  difficulty: string
  blocks: LessonBlock[]
  keyTakeaways: string[]
  nextTopic: string
}

/* ===================== Constants ===================== */

const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

const SUGGESTED_TOPICS = [
  localized('Квантовая механика', 'Quantum mechanics', 'Քվանտային մեխանիկա'),
  localized('Рекурсия в Python', 'Recursion in Python', 'Ռեկուրսիա Python-ում'),
  localized('Как работает ДНК', 'How DNA works', 'Ինչպես է աշխատում ԴՆԹ-ն'),
  localized('Теория относительности', 'Theory of relativity', 'Հարաբերականության տեսություն'),
  localized('Стоицизм', 'Stoicism', 'Ստոիցիզմ'),
]

const LEVELS = [
  { id: 'beginner', label: localized('Новичок', 'Beginner', 'Սկսնակ') },
  { id: 'intermediate', label: localized('Средний', 'Intermediate', 'Միջին') },
  { id: 'advanced', label: localized('Продвинутый', 'Advanced', 'Առաջադեմ') },
] as const

/* ===================== Main view ===================== */

export function LessonsView() {
  const { activeSubject } = useNav()
  const { locale, tr, localize } = useTranslations()
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState<string | null>(activeSubject)
  const [level, setLevel] = useState<(typeof LEVELS)[number]['id']>('beginner')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const lessonRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // On mount: pick up handoff topic from sessionStorage (set by Paths view)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored =
      window.sessionStorage.getItem('skilloasis:lesson-topic') ??
      window.sessionStorage.getItem('lumina:lesson-topic')
    if (stored) {
      window.sessionStorage.removeItem('skilloasis:lesson-topic')
      window.sessionStorage.removeItem('lumina:lesson-topic')
      setTopic(stored)
      // Fire generation on next tick so state settles
      setTimeout(() => {
        void generate(stored)
      }, 60)
    }
    // Mount-only effect: picks up handoff topic from sessionStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync subject from nav when it changes
  useEffect(() => {
    if (activeSubject) setSubject(activeSubject)
  }, [activeSubject])

  // Reading progress: track scroll position relative to lesson container
  useEffect(() => {
    if (!lesson) {
      setProgress(0)
      return
    }
    function onScroll() {
      const el = lessonRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = Math.max(el.offsetHeight - window.innerHeight, 1)
      const scrolled = Math.max(-rect.top, 0)
      const pct = Math.min(100, Math.max(0, (scrolled / total) * 100))
      setProgress(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [lesson])

  const generate = useCallback(
    async (topicArg?: string) => {
      const finalTopic = (topicArg ?? topic).trim()
      if (!finalTopic) {
        toast.error(tr('Введи тему урока', 'Enter a lesson topic', 'Մուտքագրիր դասի թեման'))
        inputRef.current?.focus()
        return
      }
      setTopic(finalTopic)
      setLoading(true)
      try {
        const res = await fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: finalTopic,
            subject: subject ?? 'general',
            level: localize(LEVELS.find((item) => item.id === level)!.label),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(tr('Не удалось создать урок. Попробуйте ещё раз.', 'Could not create the lesson. Please try again.', 'Չհաջողվեց ստեղծել դասը։ Փորձեք կրկին։'))
        }
        setLesson(data.lesson as Lesson)
        if (typeof data.xp === 'number') {
          useUser.setState({ xp: data.xp, level: data.level })
        }
        toast.success(tr('Урок готов! +25 XP', 'Lesson ready! +25 XP', 'Դասը պատրաստ է։ +25 XP'))
        // Scrolling is handled by the dedicated effect below (fires when lesson
        // commits to the DOM, so the ref is reliably attached).
      } catch (e) {
        const msg = e instanceof Error ? e.message : tr('Не удалось создать урок', 'Could not create the lesson', 'Չհաջողվեց ստեղծել դասը')
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [topic, subject, level, tr, localize]
  )

  const resetToNew = useCallback(() => {
    setLesson(null)
    setTopic('')
    setProgress(0)
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  // Smooth-scroll to the lesson reader whenever a new lesson finishes loading.
  // Using an effect (rather than a setTimeout inside generate) guarantees the
  // ref is attached to the freshly-mounted DOM node.
  useEffect(() => {
    if (!lesson || loading) return
    const t = window.setTimeout(() => {
      lessonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(t)
  }, [lesson, loading])

  const subjectObj = subject ? getSubject(subject) : undefined

  return (
    <PageSection className="py-8">
      {/* Reading progress bar — fixed below the topbar */}
      <AnimatePresence>
        {lesson && (
          <motion.div
            key="progress-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 right-0 top-16 z-30 h-1"
          >
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader
        title={tr('Интерактивные уроки', 'Interactive lessons', 'Ինտերակտիվ դասեր')}
        subtitle={tr('Введи тему — AI создаст красивый урок за секунды', 'Enter a topic and AI will create a rich lesson in seconds', 'Մուտքագրիր թեման, և AI-ը վայրկյանների ընթացքում կստեղծի ամբողջական դաս')}
        icon={BookOpen}
      />

      {/* Input panel: full or compact */}
      {/* Saved lessons */}
      <SavedLessonsBar onOpen={(t, s) => { setTopic(t); setSubject(s); generate(t) }} />

      <div className="mb-6">
        <AnimatePresence mode="wait">
          {lesson ? (
            <motion.div
              key="compact-bar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CompactBar
                lesson={lesson}
                onNew={resetToNew}
                subjectLabel={subjectObj ? localizeSubject(subjectObj, locale).name : undefined}
                onScrollToLesson={() =>
                  lessonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="full-input"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <FullInputPanel
                topic={topic}
                setTopic={setTopic}
                subject={subject}
                setSubject={setSubject}
                level={level}
                setLevel={setLevel}
                loading={loading}
                onGenerate={generate}
                inputRef={inputRef}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skeleton while generating */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LessonSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson reader — keyed by title so a new lesson re-mounts & replays
          the reveal animation. No AnimatePresence here so the new node mounts
          immediately (keeping the scroll-to-lesson ref reliable). */}
      {lesson && !loading && (
        <motion.div
          key={`reader-${lesson.title}`}
          ref={lessonRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <LessonReader
            lesson={lesson}
            subjectLabel={subjectObj ? localizeSubject(subjectObj, locale).name : undefined}
            onNext={(t) => generate(t)}
          />
        </motion.div>
      )}

      {/* Empty state with suggested topics */}
      <AnimatePresence>
        {!lesson && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={Sparkles}
              title={tr('Идеи для изучения', 'Ideas to explore', 'Ուսումնասիրության գաղափարներ')}
              description={tr('Введи свою тему выше или начни с одной из этих', 'Enter your own topic above or start with one of these', 'Վերևում մուտքագրիր քո թեման կամ սկսիր այս տարբերակներից մեկից')}
              action={
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_TOPICS.map((suggestion) => {
                    const text = localize(suggestion)
                    return (
                    <button
                      key={text}
                      onClick={() => generate(text)}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
                    >
                      {text}
                      <ChevronRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </button>
                    )
                  })}
                </div>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageSection>
  )
}

/* ===================== Full input panel ===================== */

function FullInputPanel({
  topic,
  setTopic,
  subject,
  setSubject,
  level,
  setLevel,
  loading,
  onGenerate,
  inputRef,
}: {
  topic: string
  setTopic: (v: string) => void
  subject: string | null
  setSubject: (v: string | null) => void
  level: (typeof LEVELS)[number]['id']
  setLevel: (v: (typeof LEVELS)[number]['id']) => void
  loading: boolean
  onGenerate: (topic?: string) => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const { locale, tr, localize } = useTranslations()
  return (
    <GlassCard className="overflow-hidden" hover={false} gradient>
      <div className="p-5 sm:p-6">
        <label className="mb-2 block text-sm font-medium">{tr('Что хочешь изучить?', 'What would you like to learn?', 'Ի՞նչ ես ուզում սովորել')}</label>
        <textarea
          ref={inputRef}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={tr('Например: как работают нейронные сети', 'For example: how neural networks work', 'Օրինակ՝ ինչպես են աշխատում նեյրոնային ցանցերը')}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              onGenerate()
            }
          }}
          className="w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none ring-primary/20 transition placeholder:text-muted-foreground/60 focus:ring-2"
        />

        {/* Subject chips */}
        <div className="mt-4">
          <p className="mb-2 text-xs text-muted-foreground">{tr('Предмет:', 'Subject:', 'Առարկա։')}</p>
          <div className="flex flex-wrap gap-2">
            <SubjectChip
              active={!subject}
              emoji="✨"
              label={tr('Авто', 'Auto', 'Ավտո')}
              onClick={() => setSubject(null)}
            />
            {SUBJECTS.map((s) => (
              <SubjectChip
                key={s.id}
                active={subject === s.id}
                emoji={s.emoji}
                label={localizeSubject(s, locale).name}
                onClick={() => setSubject(s.id)}
              />
            ))}
          </div>
        </div>

        {/* Level + Generate */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">{tr('Уровень:', 'Level:', 'Մակարդակ։')}</p>
            <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
              {LEVELS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLevel(item.id)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    level === item.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {localize(item.label)}
                </button>
              ))}
            </div>
          </div>
          <GradientButton onClick={() => onGenerate()} disabled={loading} className="mt-5 sm:mt-0">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {tr('Создаю урок...', 'Creating lesson...', 'Ստեղծում ենք դասը...')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {tr('Создать урок', 'Create lesson', 'Ստեղծել դաս')}
              </>
            )}
          </GradientButton>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground/70">
          {tr('Подсказка: нажми', 'Tip: press', 'Հուշում․ սեղմիր')} <kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 font-mono text-[10px]">⌘/Ctrl + Enter</kbd> {tr('для быстрого запуска', 'to start quickly', 'արագ սկսելու համար')}
        </p>
      </div>
    </GlassCard>
  )
}

function SubjectChip({
  active,
  emoji,
  label,
  onClick,
}: {
  active: boolean
  emoji: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-primary/50 bg-primary/15 text-foreground shadow-sm'
          : 'border-border/60 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
      }`}
    >
      <span className="text-sm leading-none">{emoji}</span>
      {label}
    </button>
  )
}

/* ===================== Compact bar ===================== */

function CompactBar({
  lesson,
  onNew,
  onScrollToLesson,
  subjectLabel,
}: {
  lesson: Lesson
  onNew: () => void
  onScrollToLesson: () => void
  subjectLabel?: string
}) {
  const { tr } = useTranslations()
  return (
    <GlassCard className="overflow-hidden" hover={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <button
          onClick={onScrollToLesson}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-xl ring-1 ring-primary/20">
            {lesson.emoji || '📖'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{lesson.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {subjectLabel ? `${subjectLabel} · ` : ''}
              {lesson.durationMin} {tr('мин', 'min', 'րոպե')} · {lesson.difficulty}
            </p>
          </div>
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {tr('Новый урок', 'New lesson', 'Նոր դաս')}
        </button>
      </div>
    </GlassCard>
  )
}

/* ===================== Skeleton ===================== */

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-muted/60 ${className ?? ''}`}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  )
}

function LessonSkeleton() {
  const { tr } = useTranslations()
  return (
    <GlassCard className="overflow-hidden" hover={false}>
      <LoadingState
        label={tr('Создаём твой урок...', 'Creating your lesson...', 'Ստեղծում ենք քո դասը...')}
        className="border-b border-border/60 py-4"
      />
      {/* Hero skeleton */}
      <div className="border-b border-border/60 bg-muted/10 p-6 sm:p-8">
        <div className="flex gap-4">
          <Shimmer className="h-20 w-20 shrink-0 rounded-3xl" />
          <div className="flex-1 space-y-3">
            <Shimmer className="h-7 w-3/4" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Shimmer className="h-5 w-16 rounded-full" />
              <Shimmer className="h-5 w-20 rounded-full" />
              <Shimmer className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      {/* Blocks skeleton */}
      <div className="space-y-5 p-5 sm:p-8">
        <Shimmer className="h-6 w-1/3" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <Shimmer className="h-3 w-4/5" />
        <Shimmer className="h-20 w-full rounded-2xl" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-3/4" />
        <Shimmer className="h-6 w-1/4" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-2/3" />
      </div>
    </GlassCard>
  )
}

/* ===================== Lesson reader ===================== */

function LessonReader({
  lesson,
  subjectLabel,
  onNext,
}: {
  lesson: Lesson
  subjectLabel?: string
  onNext: (topic: string) => void
}) {
  const { tr } = useTranslations()
  const blocks = lesson.blocks ?? []
  const takeaways = lesson.keyTakeaways ?? []

  return (
    <GlassCard className="overflow-hidden" hover={false}>
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-pink-500/15" />
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-4 sm:gap-5">
            <motion.div
              initial={{ scale: 0.7, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-5xl shadow-lg shadow-fuchsia-500/30"
            >
              {lesson.emoji || '📖'}
            </motion.div>
            <div className="min-w-0 flex-1">
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                {lesson.title}
              </h1>
              <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
                {lesson.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill>
                  <Clock className="h-3 w-3" /> {lesson.durationMin} {tr('мин', 'min', 'րոպե')}
                </Pill>
                <Pill>
                  <Gauge className="h-3 w-3" /> {lesson.difficulty}
                </Pill>
                {subjectLabel && (
                  <Pill>
                    <BookOpen className="h-3 w-3" /> {subjectLabel}
                  </Pill>
                )}
              </div>

              {/* Media actions: browser narration + bookmark */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <AudioNarration
                  text={`${lesson.title}. ${lesson.summary}. ${takeaways.join(' ')}`}
                  label={tr('Слушать урок', 'Listen to lesson', 'Լսել դասը')}
                />
                <BookmarkButton topic={lesson.title} subject={subjectLabel ?? 'general'} lessonJson={JSON.stringify(lesson)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="p-5 sm:p-8">
        <StaggerGroup className="space-y-5">
          {blocks.map((block, i) => (
            <StaggerItem key={i}>
              <BlockRenderer block={block} />
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Key takeaways */}
        {takeaways.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary ring-1 ring-primary/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">{tr('Ключевые выводы', 'Key takeaways', 'Հիմնական եզրակացություններ')}</h3>
            </div>
            <StaggerGroup className="grid gap-3 sm:grid-cols-2">
              {takeaways.map((kt, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/30">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm leading-relaxed text-muted-foreground">{kt}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        )}

        {/* What's next */}
        {lesson.nextTopic && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4 }}
            className="mt-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 p-5"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary/80">
              {tr('Что дальше', 'What is next', 'Ինչ է հաջորդը')}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold sm:text-lg">{lesson.nextTopic}</p>
              <GradientButton onClick={() => onNext(lesson.nextTopic)}>
                {tr('Создать урок', 'Create lesson', 'Ստեղծել դաս')} <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </div>
          </motion.div>
        )}
      </div>
    </GlassCard>
  )
}

/* ===================== Block renderer ===================== */

function BlockRenderer({ block }: { block: LessonBlock }) {
  const { tr } = useTranslations()
  switch (block.type) {
    case 'heading':
      return (
        <div className="pt-2">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{block.text}</h2>
          <div className="mt-2 h-0.5 w-16 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        </div>
      )

    case 'paragraph':
      return (
        <MarkdownText className="text-[15px] text-foreground/90">{block.text}</MarkdownText>
      )

    case 'analogy':
      return (
        <AccentCard
          icon={Lightbulb}
          label={tr('Аналогия', 'Analogy', 'Համեմատություն')}
          accent="amber"
        >
          <MarkdownText className="text-sm text-foreground/90">{block.text}</MarkdownText>
        </AccentCard>
      )

    case 'example':
      return (
        <AccentCard
          icon={FlaskConical}
          label={tr('Пример', 'Example', 'Օրինակ')}
          accent="emerald"
        >
          <MarkdownText className="text-sm text-foreground/90">{block.text}</MarkdownText>
        </AccentCard>
      )

    case 'callout':
      return (
        <AccentCard
          icon={AlertCircle}
          label={tr('Важно', 'Important', 'Կարևոր')}
          accent="rose"
        >
          <MarkdownText className="text-sm text-foreground/90">{block.text}</MarkdownText>
        </AccentCard>
      )

    case 'code':
      return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-zinc-950/90">
          {block.lang && (
            <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-2">
              <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">{block.lang}</span>
            </div>
          )}
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
            <code className="font-mono text-foreground/90">{block.code ?? ''}</code>
          </pre>
        </div>
      )

    case 'steps':
      return (
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{tr('Шаги', 'Steps', 'Քայլեր')}</p>
          </div>
          <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
            {(block.items ?? []).map((item, i) => (
              <li key={i} className="relative flex gap-3">
                <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-primary/40 bg-card text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 pt-1">
                  <MarkdownText className="text-sm text-foreground/90">{item}</MarkdownText>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )

    case 'quote':
      return (
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/40 p-5 sm:p-6">
          <Quote className="absolute right-4 top-3 h-10 w-10 text-primary/15" />
          <blockquote className="relative text-base italic leading-relaxed text-foreground/90 sm:text-lg">
            {block.text}
          </blockquote>
        </div>
      )

    default:
      return null
  }
}

/* ===================== Shared sub-components ===================== */

function AccentCard({
  icon: Icon,
  label,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  accent: 'amber' | 'emerald' | 'rose'
  children: React.ReactNode
}) {
  const palette = {
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/[0.06]',
      tile: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
      label: 'text-amber-400/80',
    },
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/[0.06]',
      tile: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
      label: 'text-emerald-400/80',
    },
    rose: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/[0.06]',
      tile: 'bg-rose-500/15 text-rose-400 ring-rose-500/30',
      label: 'text-rose-400/80',
    },
  }[accent]

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${palette.border} ${palette.bg} p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${palette.tile}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${palette.label}`}>
            {label}
          </p>
          {children}
        </div>
      </div>
    </div>
  )
}

function MarkdownText({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={`[&>p]:my-0 [&>p+p]:mt-2.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 leading-relaxed ${className ?? ''}`}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}

/* ===================== Saved Lessons Bar ===================== */

function SavedLessonsBar({ onOpen }: { onOpen: (topic: string, subject: string) => void }) {
  const [bookmarks, setBookmarks] = useState<Array<{ id: string; topic: string; subject: string; createdAt: string }>>([])
  const [open, setOpen] = useState(false)
  const { tr } = useTranslations()

  useEffect(() => {
    fetch('/api/bookmarks', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setBookmarks(data.bookmarks ?? []))
      .catch(() => {})
  }, [])

  if (bookmarks.length === 0) return null

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bookmark className="h-4 w-4 text-primary" />
        {tr('Избранные уроки', 'Saved lessons', 'Պահված դասեր')} ({bookmarks.length})
        {open ? <ChevronRight className="h-3.5 w-3.5 rotate-90" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-wrap gap-2">
              {bookmarks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onOpen(b.topic, b.subject)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Bookmark className="h-3 w-3 fill-primary text-primary" />
                  {b.topic}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
