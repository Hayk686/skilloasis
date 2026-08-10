'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Trophy,
  Sparkles,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Clock,
  Target,
  Award,
  ChevronRight,
  Lightbulb,
} from 'lucide-react'
import { useNav, useUser } from '@/lib/store'
import { SUBJECTS, getSubject } from '@/lib/subjects'
import {
  PageSection,
  SectionHeader,
  GlassCard,
  EmptyState,
  GradientButton,
  Pill,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui-blocks'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn, seededFraction } from '@/lib/utils'

// ---------- types & constants ----------

type Phase = 'setup' | 'loading' | 'quiz' | 'results'

interface QuizQuestion {
  id: string | number
  question: string
  options: string[]
  correctIndex?: number
  explanation?: string
  difficulty: string
}

interface QuizResult {
  correct: number
  total: number
  xpGain: number
  xp: number
  level: number
}

const COUNTS = [3, 5, 10, 15]
const LEVELS = ['Любой', 'Новичок', 'Средний', 'Продвинутый']
const LETTERS = ['A', 'B', 'C', 'D']

const FALLBACK_TOPICS = [
  'Основы Python',
  'Линейная алгебра',
  'Законы Ньютона',
  'English tenses',
  'Древняя Греция',
  'Стоицизм',
  'React Hooks',
  'Теория вероятностей',
]

// ---------- helpers ----------

function difficultyMeta(d: string) {
  const diff = (d || '').toLowerCase()
  if (
    diff.startsWith('easy') ||
    diff.startsWith('лёг') ||
    diff.startsWith('лег') ||
    diff.startsWith('прост')
  ) {
    return {
      label: 'Легко',
      cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      dot: 'bg-emerald-400',
    }
  }
  if (
    diff.startsWith('hard') ||
    diff.startsWith('слож') ||
    diff.startsWith('тяж') ||
    diff.startsWith('прод')
  ) {
    return {
      label: 'Сложно',
      cls: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
      dot: 'bg-rose-400',
    }
  }
  return {
    label: 'Средне',
    cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ---------- main view ----------

export function QuizView() {
  const { activeSubject } = useNav()
  const [phase, setPhase] = useState<Phase>('setup')
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState<string>(activeSubject || 'programming')
  const [count, setCount] = useState<number>(5)
  const [level, setLevel] = useState<string>('Любой')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<(number | null | undefined)[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Prefill subject from nav if available
  useEffect(() => {
    if (activeSubject) setSubject(activeSubject)
  }, [activeSubject])

  // Per-question elapsed timer (stops once revealed)
  useEffect(() => {
    setElapsed(0)
  }, [currentIdx])
  useEffect(() => {
    if (phase !== 'quiz' || revealed) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [phase, currentIdx, revealed])

  const suggestedTopics = useMemo(() => {
    const subj = getSubject(subject)
    return subj?.topics?.slice(0, 6) ?? FALLBACK_TOPICS
  }, [subject])

  const currentScore = useMemo(() => {
    return questions.reduce((acc, q, i) => {
      const isRevealed = i < currentIdx || (i === currentIdx && revealed)
      if (isRevealed && answers[i] === q.correctIndex) return acc + 1
      return acc
    }, 0)
  }, [questions, currentIdx, revealed, answers])

  const addressedCount = useMemo(
    () => answers.filter((a) => a !== undefined).length,
    [answers]
  )

  async function startQuiz(opts?: {
    topic?: string
    subject?: string
    count?: number
    level?: string
  }) {
    const t = (opts?.topic ?? topic).trim()
    const s = opts?.subject ?? subject
    const c = opts?.count ?? count
    const l = opts?.level ?? level
    if (!t) {
      toast.error('Укажите тему квиза')
      return
    }
    setTopic(t)
    setSubject(s)
    setCount(c)
    setLevel(l)
    setPhase('loading')
    setQuizResult(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          subject: s,
          count: c,
          level: l === 'Любой' ? undefined : l,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (!data.questions?.length) throw new Error('Нет вопросов')
      if (!data.attemptId) throw new Error('Нет идентификатора квиза')
      setAttemptId(data.attemptId)
      setQuestions(data.questions)
      setAnswers(Array(data.questions.length).fill(undefined))
      setCurrentIdx(0)
      setRevealed(false)
      setElapsed(0)
      setPhase('quiz')
      toast.success('Квиз готов! Удачи 🎯')
    } catch {
      toast.error('Не удалось создать квиз. Попробуйте ещё раз.')
      setPhase('setup')
    }
  }

  function selectOption(idx: number) {
    if (revealed) return
    const next = [...answers]
    next[currentIdx] = idx
    setAnswers(next)
  }

  async function submitAnswer(selectedIndex: number | null) {
    if (!attemptId) return
    const res = await fetch('/api/quiz', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, questionIndex: currentIdx, selectedIndex }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setQuestions((current) => current.map((question, index) =>
      index === currentIdx
        ? { ...question, correctIndex: data.correctIndex, explanation: data.explanation }
        : question
    ))
    setRevealed(true)
  }

  async function handleCheck() {
    const selected = answers[currentIdx]
    if (selected === undefined || selected === null) {
      toast.error('Выбери вариант ответа')
      return
    }
    try {
      await submitAnswer(selected)
    } catch {
      toast.error('Не удалось проверить ответ')
    }
  }

  async function handleSkip() {
    if (revealed) return
    const next = [...answers]
    next[currentIdx] = null
    setAnswers(next)
    try {
      await submitAnswer(null)
    } catch {
      toast.error('Не удалось пропустить вопрос')
    }
  }

  async function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      await finishQuiz()
    } else {
      setCurrentIdx(currentIdx + 1)
      setRevealed(false)
    }
  }

  async function finishQuiz() {
    if (!attemptId) return
    setPhase('results')
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuizResult(data)
      useUser.setState({ xp: data.xp, level: data.level })
      if (data.xpGain > 0) {
        toast.success(`+${data.xpGain} XP`, { description: 'Прогресс сохранён' })
      }
    } catch {
      toast.error('Не удалось сохранить прогресс')
    } finally {
      setSubmitting(false)
    }
  }

  function resetToSetup(clearTopic = true) {
    setPhase('setup')
    setQuestions([])
    setAttemptId(null)
    setAnswers([])
    setCurrentIdx(0)
    setRevealed(false)
    setQuizResult(null)
    if (clearTopic) setTopic('')
  }

  return (
    <PageSection className="py-8">
      <SectionHeader
        title="Квиз-арена"
        subtitle="Адаптивный квиз по любой теме — проверь себя и заработай XP"
        icon={Trophy}
      />

      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <SetupPhase
              topic={topic}
              setTopic={setTopic}
              subject={subject}
              setSubject={setSubject}
              count={count}
              setCount={setCount}
              level={level}
              setLevel={setLevel}
              suggestedTopics={suggestedTopics}
              onStart={() => startQuiz()}
            />
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuizSkeleton />
          </motion.div>
        )}

        {phase === 'quiz' && questions.length > 0 && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuizPhase
              question={questions[currentIdx]}
              questionNumber={currentIdx + 1}
              total={questions.length}
              selected={answers[currentIdx]}
              revealed={revealed}
              score={currentScore}
              elapsed={elapsed}
              progressValue={(addressedCount / questions.length) * 100}
              onSelect={selectOption}
              onCheck={handleCheck}
              onSkip={handleSkip}
              onNext={handleNext}
              onExit={() => resetToSetup(true)}
              isLast={currentIdx + 1 >= questions.length}
            />
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultsPhase
              questions={questions}
              answers={answers}
              topic={topic}
              subject={subject}
              result={quizResult}
              submitting={submitting}
              onNewQuiz={() => resetToSetup(true)}
              onRetryTopic={() => startQuiz({ topic })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageSection>
  )
}

// ---------- setup phase ----------

function SetupPhase({
  topic,
  setTopic,
  subject,
  setSubject,
  count,
  setCount,
  level,
  setLevel,
  suggestedTopics,
  onStart,
}: {
  topic: string
  setTopic: (v: string) => void
  subject: string
  setSubject: (v: string) => void
  count: number
  setCount: (v: number) => void
  level: string
  setLevel: (v: string) => void
  suggestedTopics: string[]
  onStart: () => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <GlassCard className="p-6 sm:p-8" hover={false}>
        <div className="space-y-6">
          {/* subject chips */}
          <div>
            <label className="mb-2 block text-sm font-medium">Предмет</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubject(s.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    subject === s.id
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  <span>{s.emoji}</span>
                  <span>{s.ru}</span>
                </button>
              ))}
            </div>
          </div>

          {/* topic input */}
          <div>
            <label className="mb-2 block text-sm font-medium">Тема квиза</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onStart()
              }}
              placeholder="Например: замыкания в JavaScript"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none ring-primary/20 transition focus:ring-2"
            />
            <div className="mt-3">
              <p className="mb-2 text-xs text-muted-foreground">Подсказки:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {t}
                    <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* count + level selectors */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Вопросов</label>
              <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCount(c)}
                    className={cn(
                      'min-w-[2.5rem] rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                      count === c
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Уровень</label>
              <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      level === l
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <GradientButton onClick={onStart} className="w-full px-6 py-3.5 text-base">
            <Sparkles className="h-5 w-5" /> Начать квиз
          </GradientButton>
        </div>
      </GlassCard>

      {/* info / motivation card */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-8" hover={false}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Адаптивные вопросы
          </div>
          <h3 className="text-2xl font-bold">Как это работает?</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                1
              </span>
              Выбери предмет и тему — или введи свою.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                2
              </span>
              AI сгенерирует уникальные вопросы с объяснениями.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                3
              </span>
              Отвечай, проверяй себя и забирай XP за верные ответы.
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill className="text-amber-300">
              <Award className="h-3 w-3" /> +10 XP за верный
            </Pill>
            <Pill className="text-emerald-300">
              <Trophy className="h-3 w-3" /> +20 XP за идеал
            </Pill>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// ---------- loading skeleton ----------

function QuizSkeleton() {
  return (
    <GlassCard className="p-6 sm:p-8" hover={false}>
      <div className="mb-6">
        <div className="mb-2 flex justify-between">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
      </div>
      <div className="mb-4 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="mb-6 h-8 w-3/4 rounded bg-muted animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border/60 p-4"
          >
            <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 flex-1 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <div className="h-10 w-44 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-60 animate-pulse" />
      </div>
    </GlassCard>
  )
}

// ---------- quiz phase ----------

function QuizPhase({
  question,
  questionNumber,
  total,
  selected,
  revealed,
  score,
  elapsed,
  progressValue,
  onSelect,
  onCheck,
  onSkip,
  onNext,
  onExit,
  isLast,
}: {
  question: QuizQuestion
  questionNumber: number
  total: number
  selected: number | null | undefined
  revealed: boolean
  score: number
  elapsed: number
  progressValue: number
  onSelect: (idx: number) => void
  onCheck: () => void
  onSkip: () => void
  onNext: () => void
  onExit: () => void
  isLast: boolean
}) {
  const diff = difficultyMeta(question.difficulty)
  const correctIndex = question.correctIndex ?? -1
  const isCorrect = revealed && selected === correctIndex
  const options = question.options ?? []

  return (
    <GlassCard className="relative overflow-hidden p-6 sm:p-8" hover={false}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-3xl" />

      {/* top: progress + stats */}
      <div className="relative mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
              title="Выйти из квиза"
              aria-label="Выйти из квиза"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold">Вопрос {questionNumber}</span>
            <span className="text-muted-foreground">из {total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Pill className="text-amber-300">
              <Trophy className="h-3 w-3" /> {score}
            </Pill>
            <Pill>
              <Clock className="h-3 w-3" /> {formatTime(elapsed)}
            </Pill>
          </div>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={questionNumber}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* difficulty badge */}
          <div className="mb-4 flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                diff.cls
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', diff.dot)} />
              {diff.label}
            </span>
          </div>

          {/* question */}
          <h3 className="mb-6 text-xl font-bold leading-snug sm:text-2xl">
            {question.question}
          </h3>

          {/* options */}
          <StaggerGroup className="space-y-3">
            {options.map((opt, i) => (
              <StaggerItem key={i}>
                <OptionCard
                  letter={LETTERS[i] ?? String(i + 1)}
                  text={opt}
                  index={i}
                  selected={selected === i}
                  correct={correctIndex}
                  revealed={revealed}
                  onClick={() => onSelect(i)}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* explanation */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <ExplanationCard
                  isCorrect={!!isCorrect}
                  skipped={selected === null || selected === undefined}
                  explanation={question.explanation ?? ''}
                  correctText={options[correctIndex]}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* actions */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {!revealed ? (
              <>
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Пропустить
                </button>
                <GradientButton
                  onClick={onCheck}
                  disabled={selected === undefined || selected === null}
                >
                  <Check className="h-4 w-4" /> Проверить
                </GradientButton>
              </>
            ) : (
              <div className="ml-auto">
                <GradientButton onClick={onNext}>
                  {isLast ? (
                    <>
                      Завершить квиз <Trophy className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Следующий вопрос <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </GradientButton>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  )
}

function OptionCard({
  letter,
  text,
  index,
  selected,
  correct,
  revealed,
  onClick,
}: {
  letter: string
  text: string
  index: number
  selected: boolean
  correct: number
  revealed: boolean
  onClick: () => void
}) {
  const isCorrect = revealed && index === correct
  const isWrong = revealed && selected && index !== correct

  return (
    <motion.button
      type="button"
      whileHover={!revealed ? { scale: 1.01 } : undefined}
      whileTap={!revealed ? { scale: 0.99 } : undefined}
      onClick={onClick}
      disabled={revealed}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all',
        !revealed &&
          'border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70',
        !revealed && selected && 'border-primary bg-primary/10 ring-1 ring-primary/30',
        isCorrect && 'border-emerald-500/60 bg-emerald-500/15',
        isWrong && 'border-rose-500/60 bg-rose-500/15',
        revealed && !isCorrect && !isWrong && 'border-border/40 bg-card/30 opacity-60'
      )}
    >
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-sm font-bold transition-colors',
          !revealed && 'border-border/60 bg-muted/40 text-muted-foreground',
          !revealed && selected && 'border-primary bg-primary text-primary-foreground',
          isCorrect && 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300',
          isWrong && 'border-rose-500/60 bg-rose-500/20 text-rose-300'
        )}
      >
        {letter}
      </span>
      <span className="flex-1 text-sm sm:text-base">{text}</span>
      {isCorrect && <Check className="h-5 w-5 shrink-0 text-emerald-400" />}
      {isWrong && <X className="h-5 w-5 shrink-0 text-rose-400" />}
    </motion.button>
  )
}

function ExplanationCard({
  isCorrect,
  skipped,
  explanation,
  correctText,
}: {
  isCorrect: boolean
  skipped: boolean
  explanation: string
  correctText?: string
}) {
  return (
    <div
      className={cn(
        'mt-4 rounded-xl border p-4',
        isCorrect
          ? 'border-emerald-500/40 bg-emerald-500/10'
          : 'border-rose-500/40 bg-rose-500/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
            isCorrect
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/20 text-rose-300'
          )}
        >
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-semibold',
              isCorrect ? 'text-emerald-300' : 'text-rose-300'
            )}
          >
            {isCorrect ? 'Верно! 🎉' : skipped ? 'Пропущено' : 'Не совсем...'}
          </p>
          {!isCorrect && correctText && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Правильный ответ: </span>
              <span className="font-medium text-emerald-300">{correctText}</span>
            </p>
          )}
          {explanation && (
            <p className="mt-1 text-sm text-muted-foreground">{explanation}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- results phase ----------

function ResultsPhase({
  questions,
  answers,
  topic,
  subject,
  result,
  submitting,
  onNewQuiz,
  onRetryTopic,
}: {
  questions: QuizQuestion[]
  answers: (number | null | undefined)[]
  topic: string
  subject: string
  result: QuizResult | null
  submitting: boolean
  onNewQuiz: () => void
  onRetryTopic: () => void
}) {
  const total = questions.length
  const correct = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  )
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const subj = getSubject(subject)

  const isPerfect = correct === total && total > 0
  const isGood = pct >= 70
  const isOk = pct >= 40

  const headline = isPerfect
    ? 'Безупречно!'
    : isGood
      ? 'Отличная работа!'
      : isOk
        ? 'Неплохо!'
        : 'Есть над чем поработать'
  const headlineEmoji = isPerfect ? '🏆' : isGood ? '🌟' : isOk ? '✨' : '💪'

  return (
    <div className="relative">
      <Confetti run={isGood} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <GlassCard className="relative overflow-hidden p-6 text-center sm:p-10" hover={false}>
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-violet-500/20 via-fuchsia-500/10 to-transparent" />

          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
            className="relative mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-4xl shadow-lg shadow-fuchsia-500/40"
          >
            {headlineEmoji}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-bold sm:text-3xl"
          >
            {headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            Квиз по теме «{topic}»
            {subj ? ` · ${subj.emoji} ${subj.ru}` : ''}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 200 }}
            className="mt-6 flex items-end justify-center gap-2"
          >
            <span className="text-6xl font-black text-gradient sm:text-7xl">
              {correct}
            </span>
            <span className="mb-2 text-2xl text-muted-foreground">/ {total}</span>
          </motion.div>

          {/* stats grid */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Target} label="Точность" value={`${pct}%`} accent="text-violet-300" />
            <StatCard icon={Check} label="Верно" value={`${correct}`} accent="text-emerald-300" />
            <StatCard icon={X} label="Ошибок" value={`${total - correct}`} accent="text-rose-300" />
            <StatCard
              icon={Award}
              label="XP получено"
              value={submitting ? '…' : result ? `+${result.xpGain}` : '—'}
              accent="text-amber-300"
            />
          </div>

          {/* actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <GradientButton onClick={onRetryTopic} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Ещё по этой теме
            </GradientButton>
            <button
              type="button"
              onClick={onNewQuiz}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background/70"
            >
              <Sparkles className="h-4 w-4" /> Новый квиз
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* review */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="border-b border-border/60 p-5">
            <h3 className="text-lg font-bold">Разбор ответов</h3>
            <p className="text-sm text-muted-foreground">
              Посмотри правильные ответы и объяснения
            </p>
          </div>
          <div className="px-4 py-2 sm:px-5">
            {questions.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Нет вопросов для разбора"
                description="Попробуй пройти квиз ещё раз"
              />
            ) : (
              <Accordion type="single" collapsible>
                {questions.map((q, i) => {
                  const ans = answers[i]
                  const correctIndex = q.correctIndex ?? -1
                  const wasCorrect = ans === correctIndex
                  const wasSkipped = ans === null || ans === undefined
                  const qOptions = q.options ?? []
                  return (
                    <AccordionItem key={q.id ?? i} value={`q-${i}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center gap-3 pr-3 text-left">
                          <span
                            className={cn(
                              'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                              wasCorrect
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            )}
                          >
                            {wasCorrect ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="line-clamp-2 text-sm font-medium">
                            <span className="text-muted-foreground">{i + 1}.</span>{' '}
                            {q.question}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-4 text-sm">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                            <p className="text-xs font-medium text-rose-300">
                              {wasSkipped ? 'Пропущено' : 'Твой ответ'}
                            </p>
                            <p className="mt-1 text-foreground">
                              {wasSkipped || ans === null || ans === undefined
                                ? '—'
                                : (qOptions[ans] ?? '—')}
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                            <p className="text-xs font-medium text-emerald-300">
                              Правильный ответ
                            </p>
                            <p className="mt-1 text-foreground">
                              {qOptions[correctIndex] ?? '—'}
                            </p>
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                            <p className="text-muted-foreground">{q.explanation}</p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <Icon className={cn('h-4 w-4', accent)} />
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ---------- confetti ----------

function Confetti({ run }: { run: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: seededFraction(i * 17 + 1) * 100,
        delay: seededFraction(i * 29 + 2) * 0.5,
        duration: 1.8 + seededFraction(i * 37 + 3) * 1.6,
        rotate: seededFraction(i * 43 + 4) * 720 - 360,
        color: [
          'bg-violet-400',
          'bg-fuchsia-400',
          'bg-pink-400',
          'bg-amber-300',
          'bg-emerald-300',
          'bg-rose-300',
        ][i % 6],
        size: 6 + seededFraction(i * 53 + 5) * 8,
        rounded: seededFraction(i * 61 + 6) > 0.5,
      })),
    []
  )
  if (!run) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={cn('absolute top-0', p.color, p.rounded ? 'rounded-full' : 'rounded-sm')}
          style={{ left: `${p.left}%`, width: p.size, height: p.size }}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: ['0vh', '110vh'], opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
