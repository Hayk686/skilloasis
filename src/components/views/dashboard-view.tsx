'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  LayoutDashboard,
  Flame,
  Zap,
  Sparkles,
  Trophy,
  BookOpen,
  Layers,
  MessagesSquare,
  Award,
  Target,
  Clock,
  TrendingUp,
  Pencil,
  Check,
  Loader2,
  ChevronRight,
  Calendar,
  Star,
  ChevronDown,
  ArrowRight,
  Brain,
  Rocket,
  Gem,
  Globe,
  Lock,
  Share2,
  Volume2,
  Network,
  Code2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNav, useUser } from '@/lib/store'
import { ShareCard } from '@/components/share-card'
import { getSubject } from '@/lib/subjects'
import { levelProgress, ACHIEVEMENTS } from '@/lib/gamify-client'
import { seededFraction } from '@/lib/utils'
import {
  PageSection,
  GlassCard,
  LoadingState,
  EmptyState,
  GradientButton,
  Pill,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui-blocks'

/* ============================================================ *
 * Types
 * ============================================================ */

interface UserCounts {
  progress: number
  flashcards: number
  chatSessions: number
  lessons: number
}

interface UserAchievement {
  type: string
  unlockedAt: string
}

interface UserData {
  id: string
  name: string
  xp: number
  level: number
  streak: number
  achievements: UserAchievement[]
  counts: UserCounts
  computedLevel: number
}

interface ProgressEntry {
  id: string
  subject: string
  topic: string
  score: number
  total: number
  kind: string
  completedAt: string
}

interface SubjectAgg {
  count: number
  correct: number
  total: number
}

interface ProgressData {
  progress: ProgressEntry[]
  achievements: UserAchievement[]
  bySubject: Record<string, SubjectAgg>
  byKind: Record<string, number>
  byDay: Record<string, number>
}

interface DailyChallenge {
  date: string
  subject: string
  emoji: string
  title: string
  prompt: string
  hint: string
  xpReward: number
}

/* ============================================================ *
 * Helpers
 * ============================================================ */

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      locale: ru,
      addSuffix: true,
    })
  } catch {
    return 'недавно'
  }
}

function subjectLabel(id: string): string {
  if (!id || id === 'general') return 'Общее'
  const s = getSubject(id)
  return s ? s.ru : 'Общее'
}

function subjectGradient(id: string): string {
  const s = getSubject(id)
  return s ? s.gradient : 'from-violet-500 via-fuchsia-500 to-pink-500'
}

const KIND_META: Record<
  string,
  { icon: typeof Trophy; label: string; tone: string; ring: string }
> = {
  quiz: {
    icon: Trophy,
    label: 'Квиз',
    tone: 'text-amber-400',
    ring: 'bg-amber-500/15 ring-amber-500/30 text-amber-400',
  },
  lesson: {
    icon: BookOpen,
    label: 'Урок',
    tone: 'text-emerald-400',
    ring: 'bg-emerald-500/15 ring-emerald-500/30 text-emerald-400',
  },
  flashcard: {
    icon: Layers,
    label: 'Флешкарты',
    tone: 'text-cyan-400',
    ring: 'bg-cyan-500/15 ring-cyan-500/30 text-cyan-400',
  },
  chat: {
    icon: MessagesSquare,
    label: 'Чат',
    tone: 'text-fuchsia-400',
    ring: 'bg-fuchsia-500/15 ring-fuchsia-500/30 text-fuchsia-400',
  },
}

function getKindMeta(kind: string) {
  return (
    KIND_META[kind] || {
      icon: Sparkles,
      label: kind || 'Активность',
      tone: 'text-primary',
      ring: 'bg-primary/15 ring-primary/30 text-primary',
    }
  )
}

interface DaySeriesItem {
  key: string
  label: string
  count: number
  isToday: boolean
}

function build7DaySeries(byDay: Record<string, number>): DaySeriesItem[] {
  const days: DaySeriesItem[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const weekday = d.toLocaleDateString('ru-RU', { weekday: 'short' })
    const isToday = i === 0
    days.push({
      key,
      label: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      count: byDay[key] || 0,
      isToday,
    })
  }
  return days
}

const ACHIEVEMENT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  first_lesson: BookOpen,
  first_quiz: Trophy,
  first_chat: MessagesSquare,
  first_flashcard: Layers,
  first_audio: Volume2,
  first_mindmap: Network,
  first_code: Code2,
  first_share: Share2,
  streak_3: Flame,
  streak_7: Zap,
  level_5: Rocket,
  xp_1000: Gem,
  polyglot: Globe,
  quiz_perfect: Award,
}

/* ============================================================ *
 * XP Progress Ring
 * ============================================================ */

function XpRing({
  pct,
  level,
}: {
  pct: number
  level: number
}) {
  const r = 54
  const c = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * c
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
        <defs>
          <linearGradient id="xpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.7 0.25 315)" />
            <stop offset="55%" stopColor="oklch(0.72 0.25 350)" />
            <stop offset="100%" stopColor="oklch(0.78 0.22 55)" />
          </linearGradient>
        </defs>
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-muted/40"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#xpRingGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 8px oklch(0.7 0.25 315 / 0.55))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none text-gradient">
          {level}
        </span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          уровень
        </span>
      </div>
    </div>
  )
}

/* ============================================================ *
 * Confetti burst
 * ============================================================ */

function ConfettiBurst({ burst }: { burst: number }) {
  const particles = useMemo(() => {
    if (burst === 0) return []
    return Array.from({ length: 28 }, (_, i) => {
      const randomA = seededFraction(burst * 101 + i * 17)
      const randomB = seededFraction(burst * 211 + i * 29)
      const angle = (i / 28) * Math.PI * 2 + randomA * 0.4
      const distance = 90 + randomB * 110
      return {
        id: `${burst}-${i}`,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        delay: seededFraction(burst * 307 + i * 31) * 0.12,
        emoji: ['🎉', '✨', '⭐', '🔥', '💫', '🌟'][i % 6],
        rotate: (seededFraction(burst * 401 + i * 43) - 0.5) * 540,
      }
    })
  }, [burst])

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute text-lg"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: 0,
              scale: 1.1,
              rotate: p.rotate,
            }}
            transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================ *
 * Stat tile
 * ============================================================ */

function StatTile({
  icon: Icon,
  label,
  value,
  gradient,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  gradient: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <GlassCard className="h-full p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-xl font-bold leading-tight sm:text-2xl">
              {value}
            </div>
            <div className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">
              {label}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/* ============================================================ *
 * Quick action
 * ============================================================ */

const QUICK_ACTIONS: {
  id: Parameters<ReturnType<typeof useNav.getState>['setView']>[0]
  title: string
  desc: string
  icon: typeof Sparkles
  gradient: string
}[] = [
  {
    id: 'tutor',
    title: 'Наставник',
    desc: 'Спроси AI',
    icon: MessagesSquare,
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'lessons',
    title: 'Урок',
    desc: 'Новая тема',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'quiz',
    title: 'Квиз',
    desc: 'Проверь себя',
    icon: Trophy,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'flashcards',
    title: 'Флешкарты',
    desc: 'Запомни',
    icon: Layers,
    gradient: 'from-pink-500 to-rose-500',
  },
]

/* ============================================================ *
 * Chart tooltip
 * ============================================================ */

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const v = Number(payload[0]?.value ?? 0)
  return (
    <div className="rounded-xl border border-border/70 bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <div className="font-semibold text-foreground">{label}</div>
      <div className="mt-0.5 text-muted-foreground">
        {v === 0 ? 'нет активности' : `${v} ${pluralActivity(v)}`}
      </div>
    </div>
  )
}

function pluralActivity(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'действие'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return 'действия'
  return 'действий'
}

/* ============================================================ *
 * Main view
 * ============================================================ */

export function DashboardView() {
  const { setView } = useNav()
  const userStore = useUser()
  const { xp, level, streak, name } = userStore

  const [userData, setUserData] = useState<UserData | null>(null)
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // editable name
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(name)
  const [savingName, setSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  // daily challenge
  const [dailyDone, setDailyDone] = useState(false)
  const [submittingDaily, setSubmittingDaily] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)

  /* ---------- fetch all in parallel ---------- */
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [uRes, pRes, dRes] = await Promise.all([
          fetch('/api/user', { cache: 'no-store' }),
          fetch('/api/progress', { cache: 'no-store' }),
          fetch('/api/daily', { cache: 'no-store' }),
        ])
        const [uJson, pJson, dJson] = await Promise.all([
          uRes.ok ? uRes.json() : null,
          pRes.ok ? pRes.json() : null,
          dRes.ok ? dRes.json() : null,
        ])
        if (cancelled) return
        if (uJson?.user) {
          setUserData(uJson.user)
          // sync store with freshest data
          useUser.setState({
            userId: uJson.user.id,
            name: uJson.user.name,
            xp: uJson.user.xp,
            level: uJson.user.computedLevel ?? uJson.user.level,
            streak: uJson.user.streak,
          })
        }
        if (pJson) setProgressData(pJson)
        if (dJson?.challenge) {
          setChallenge(dJson.challenge)
          setDailyDone(Boolean(dJson.completed))
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  /* ---------- editable name ---------- */
  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editingName])

  const saveName = useCallback(async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed || trimmed === name) {
      setEditingName(false)
      setNameDraft(name)
      return
    }
    setSavingName(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      if (data.user) {
        useUser.setState({ name: data.user.name })
        setUserData((prev) =>
          prev ? { ...prev, name: data.user.name } : prev
        )
        toast.success('Имя обновлено ✨')
      }
    } catch {
      toast.error('Не удалось сохранить имя')
      setNameDraft(name)
    } finally {
      setSavingName(false)
      setEditingName(false)
    }
  }, [nameDraft, name])

  /* ---------- daily challenge submit ---------- */
  const submitDaily = useCallback(async () => {
    if (!challenge || dailyDone || submittingDaily) return
    setSubmittingDaily(true)
    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      // update store + local
      useUser.setState({
        xp: data.xp,
        level: data.level,
      })
      setUserData((prev) =>
        prev ? { ...prev, xp: data.xp, level: data.level } : prev
      )
      setDailyDone(true)
      setConfettiBurst((b) => b + 1)
      toast.success(`+${data.xpGain} XP за вызов!`, {
        description: 'Так держать — каждый шаг приближает к мечте 🚀',
      })
      setTimeout(() => setConfettiBurst(0), 1800)
    } catch {
      toast.error('Не удалось засчитать вызов')
    } finally {
      setSubmittingDaily(false)
    }
  }, [challenge, dailyDone, submittingDaily])

  /* ---------- derived ---------- */
  const lp = useMemo(() => levelProgress(xp), [xp])
  const xpInto = lp.into
  const xpSpan = lp.span
  const xpPct = lp.pct
  const xpToNext = Math.max(0, lp.next - xp)

  const daySeries = useMemo(
    () => (progressData ? build7DaySeries(progressData.byDay) : []),
    [progressData]
  )
  const weekTotal = useMemo(
    () => daySeries.reduce((s, d) => s + d.count, 0),
    [daySeries]
  )
  const allWeekZero = weekTotal === 0

  const subjectRows = useMemo(() => {
    if (!progressData) return []
    const entries = Object.entries(progressData.bySubject)
      .map(([id, agg]) => ({
        id,
        label: subjectLabel(id),
        gradient: subjectGradient(id),
        ...agg,
        accuracy: agg.total > 0 ? Math.round((agg.correct / agg.total) * 100) : null,
      }))
      .sort((a, b) => b.count - a.count)
    return entries
  }, [progressData])

  const subjectMax = useMemo(
    () => subjectRows.reduce((m, s) => Math.max(m, s.count), 0) || 1,
    [subjectRows]
  )

  const recentFeed = useMemo(() => {
    if (!progressData) return []
    return progressData.progress.slice(0, 7)
  }, [progressData])

  const unlockedAchievements = useMemo(() => {
    if (!progressData) return []
    return progressData.achievements
  }, [progressData])

  const quizCount = useMemo(
    () => (progressData?.byKind?.quiz ?? 0) as number,
    [progressData]
  )

  /* ---------- skeleton ---------- */
  if (loading) {
    return (
      <PageSection className="py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary ring-1 ring-primary/20">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Кабинет прогресса
            </h1>
            <p className="text-sm text-muted-foreground">
              Твой личный космический капсульный пульт
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2 p-6" hover={false}>
            <div className="h-44 animate-pulse rounded-xl bg-muted/40" />
          </GlassCard>
          <GlassCard className="p-6" hover={false}>
            <div className="h-44 animate-pulse rounded-xl bg-muted/40" />
          </GlassCard>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2 p-6" hover={false}>
            <div className="h-56 animate-pulse rounded-xl bg-muted/40" />
          </GlassCard>
          <GlassCard className="p-6" hover={false}>
            <div className="h-56 animate-pulse rounded-xl bg-muted/40" />
          </GlassCard>
        </div>
        <LoadingState label="Собираем звёзды в созвездия..." className="mt-4" />
      </PageSection>
    )
  }

  /* ---------- greeting ---------- */
  const hour = new Date().getHours()
  const greetingWord =
    hour < 6
      ? 'Доброй ночи'
      : hour < 12
        ? 'Доброе утро'
        : hour < 18
          ? 'Привет'
          : 'Добрый вечер'

  const streakHint =
    streak >= 7
      ? 'Ты в потоке недели! 🔥'
      : streak >= 3
        ? 'Держишь ритм — продолжай!'
        : streak >= 1
          ? 'Заходи завтра, чтобы поднять серию'
          : 'Сделай первый шаг сегодня'

  return (
    <PageSection className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary ring-1 ring-primary/20">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Кабинет прогресса
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Твой личный космический пульт роста
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill className="border-primary/30 bg-primary/10 text-primary">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}
          </Pill>
          <button
            onClick={() => setShareOpen(true)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10"
          >
            <Share2 className="h-3.5 w-3.5 text-primary transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Поделиться</span>
          </button>
        </div>
      </div>

      {/* Row 1: Hero + Daily challenge */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* HERO */}
        <StaggerGroup className="lg:col-span-2">
          <StaggerItem>
            <GlassCard gradient className="relative overflow-hidden p-6 sm:p-8">
              {/* ambient glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-gradient-to-tr from-pink-500/20 to-amber-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* left: greeting + name + streak */}
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Pill className="border-primary/30 bg-primary/10 text-primary">
                      <Sparkles className="h-3 w-3" />
                      {greetingWord}
                    </Pill>
                  </div>

                  {/* editable name */}
                  <div className="flex items-center gap-2">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={nameInputRef}
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveName()
                            } else if (e.key === 'Escape') {
                              setNameDraft(name)
                              setEditingName(false)
                            }
                          }}
                          onBlur={saveName}
                          maxLength={32}
                          className="w-44 rounded-lg border border-primary/40 bg-background/80 px-3 py-1.5 text-2xl font-bold tracking-tight outline-none focus:ring-2 focus:ring-primary/30 sm:text-3xl"
                          placeholder="Имя"
                        />
                        {savingName && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setNameDraft(name)
                          setEditingName(true)
                        }}
                        className="group inline-flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-muted/40"
                        title="Изменить имя"
                      >
                        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                          {name}
                        </h2>
                        <Pencil className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )}
                  </div>

                  {/* streak */}
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${
                        streak > 0
                          ? 'bg-gradient-to-br from-orange-500/30 to-amber-500/20 text-orange-400 ring-orange-500/30'
                          : 'bg-muted/60 text-muted-foreground ring-border/60'
                      }`}
                    >
                      <Flame
                        className={`h-5 w-5 ${streak > 0 ? 'animate-pulse-glow' : ''}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold leading-none">
                          {streak}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {pluralDays(streak)} подряд
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {streakHint}
                      </p>
                    </div>
                  </div>

                  {/* xp bar (mobile fallback / additional info) */}
                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {xpInto.toLocaleString('ru-RU')} / {xpSpan.toLocaleString('ru-RU')} XP
                      </span>
                      <span>
                        до {lp.level + 1} ур. ещё{' '}
                        <span className="font-semibold text-primary">
                          {xpToNext.toLocaleString('ru-RU')} XP
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted/70">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPct}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                {/* right: XP ring */}
                <div className="flex shrink-0 flex-col items-center justify-center">
                  <XpRing pct={xpPct} level={level} />
                  <div className="mt-2 text-center">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      всего XP
                    </div>
                    <div className="text-xl font-bold text-gradient">
                      {xp.toLocaleString('ru-RU')}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </StaggerItem>
        </StaggerGroup>

        {/* DAILY CHALLENGE */}
        <StaggerGroup>
          <StaggerItem>
            <GlassCard
              gradient
              className="relative h-full overflow-hidden p-6"
            >
              <ConfettiBurst burst={confettiBurst} />
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-pink-500/20 blur-3xl" />

              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <Pill className="border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300">
                    <Target className="h-3 w-3" />
                    Вызов дня
                  </Pill>
                  <span className="text-xs text-muted-foreground">
                    {challenge
                      ? new Date(challenge.date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </span>
                </div>

                {challenge ? (
                  <>
                    <div className="mb-3 flex items-start gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-2xl ring-1 ring-fuchsia-500/20">
                        {challenge.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {subjectLabel(challenge.subject)}
                        </div>
                        <h3 className="font-semibold leading-tight">
                          {challenge.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {challenge.prompt}
                    </p>

                    {/* hint */}
                    <button
                      onClick={() => setHintOpen((v) => !v)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${hintOpen ? 'rotate-180' : ''}`}
                      />
                      {hintOpen ? 'Скрыть подсказку' : 'Показать подсказку'}
                    </button>
                    <AnimatePresence>
                      {hintOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs italic text-muted-foreground">
                            💡 {challenge.hint}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* reward + action */}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <Pill className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                        <Zap className="h-3 w-3" />+{challenge.xpReward} XP
                      </Pill>
                      {dailyDone ? (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">
                          <Check className="h-4 w-4" />
                          Выполнено
                        </div>
                      ) : (
                        <GradientButton
                          onClick={submitDaily}
                          disabled={submittingDaily}
                          className="px-4 py-2 text-sm"
                        >
                          {submittingDaily ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Засчитываем...
                            </>
                          ) : (
                            <>
                              Выполнить
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </GradientButton>
                      )}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={Target}
                    title="Вызов скоро появится"
                    description="Не удалось загрузить вызов дня. Загляни позже."
                  />
                )}
              </div>
            </GlassCard>
          </StaggerItem>
        </StaggerGroup>
      </div>

      {/* Row 2: Quick actions */}
      <div className="mt-6">
        <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <StaggerItem key={a.id}>
                <button
                  onClick={() => setView(a.id)}
                  className="group relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-primary/10"
                >
                  <div
                    className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.gradient} text-white shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold leading-tight">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                </button>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </div>

      {/* Row 3: Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatTile
          icon={Zap}
          label="Всего XP"
          value={xp.toLocaleString('ru-RU')}
          gradient="from-violet-500 to-fuchsia-500"
          delay={0}
        />
        <StatTile
          icon={Star}
          label="Уровень"
          value={level}
          gradient="from-fuchsia-500 to-pink-500"
          delay={0.04}
        />
        <StatTile
          icon={Flame}
          label="Серия дней"
          value={streak}
          gradient="from-orange-500 to-amber-500"
          delay={0.08}
        />
        <StatTile
          icon={BookOpen}
          label="Уроки"
          value={userData?.counts?.lessons ?? 0}
          gradient="from-emerald-500 to-teal-500"
          delay={0.12}
        />
        <StatTile
          icon={Trophy}
          label="Квизы"
          value={quizCount}
          gradient="from-amber-500 to-orange-500"
          delay={0.16}
        />
        <StatTile
          icon={Layers}
          label="Флешкарты"
          value={userData?.counts?.flashcards ?? 0}
          gradient="from-pink-500 to-rose-500"
          delay={0.2}
        />
        <StatTile
          icon={MessagesSquare}
          label="Чаты"
          value={userData?.counts?.chatSessions ?? 0}
          gradient="from-fuchsia-500 to-violet-500"
          delay={0.24}
        />
      </div>

      {/* Row 4: chart + subjects */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* 7-day chart */}
        <GlassCard className="lg:col-span-2 p-5 sm:p-6" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">Активность за 7 дней</h3>
                <p className="text-xs text-muted-foreground">
                  Каждый шаг — это рост
                </p>
              </div>
            </div>
            <Pill className="border-primary/30 bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
              {weekTotal} {pluralActivity(weekTotal)}
            </Pill>
          </div>

          {allWeekZero ? (
            <EmptyState
              icon={Calendar}
              title="Пока тихо в космосе"
              description="Сделай первый шаг — сгенерируй урок или пройди квиз, и здесь зажгутся звёзды активности."
              action={
                <GradientButton
                  onClick={() => setView('lessons')}
                  className="px-4 py-2 text-sm"
                >
                  Начать урок
                  <ArrowRight className="h-4 w-4" />
                </GradientButton>
              }
            />
          ) : mounted ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={daySeries}
                  margin={{ top: 12, right: 6, left: 6, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="barGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="oklch(0.72 0.25 350)" />
                      <stop offset="100%" stopColor="oklch(0.7 0.25 315)" />
                    </linearGradient>
                    <linearGradient
                      id="barGradToday"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="oklch(0.78 0.22 55)" />
                      <stop offset="100%" stopColor="oklch(0.72 0.25 350)" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: 'oklch(0.68 0.02 285)',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={<ChartTooltip />}
                  />
                  <Bar
                    dataKey="count"
                    radius={[7, 7, 2, 2]}
                    maxBarSize={40}
                  >
                    {daySeries.map((d) => (
                      <Cell
                        key={d.key}
                        fill={
                          d.isToday
                            ? 'url(#barGradToday)'
                            : d.count > 0
                              ? 'url(#barGrad)'
                              : 'oklch(0.32 0.02 285 / 0.4)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </GlassCard>

        {/* Subjects breakdown */}
        <GlassCard className="p-5 sm:p-6" hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">По предметам</h3>
              <p className="text-xs text-muted-foreground">
                Где ты активнее всего
              </p>
            </div>
          </div>

          {subjectRows.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Карта знаний пуста"
              description="Выбери предмет и сделай первую запись в прогресс."
              action={
                <button
                  onClick={() => setView('subjects')}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  К предметам <ChevronRight className="h-3.5 w-3.5" />
                </button>
              }
            />
          ) : (
            <div className="space-y-3.5">
              {subjectRows.slice(0, 6).map((s) => {
                const pct = Math.round((s.count / subjectMax) * 100)
                return (
                  <div key={s.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {s.label}
                      </span>
                      <span className="text-muted-foreground">
                        {s.count}{' '}
                        {s.accuracy !== null && `· ${s.accuracy}%`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/70">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${s.gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Row 5: recent activity + achievements */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* recent feed */}
        <GlassCard className="lg:col-span-2 p-5 sm:p-6" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">Недавняя активность</h3>
                <p className="text-xs text-muted-foreground">
                  Хроника твоих шагов
                </p>
              </div>
            </div>
          </div>

          {recentFeed.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="История пуста"
              description="Твои достижения и активности появятся здесь. Начни с первого урока или квиза."
              action={
                <GradientButton
                  onClick={() => setView('tutor')}
                  className="px-4 py-2 text-sm"
                >
                  Спросить наставника
                  <ArrowRight className="h-4 w-4" />
                </GradientButton>
              }
            />
          ) : (
            <ul className="space-y-2">
              {recentFeed.map((p, i) => {
                const meta = getKindMeta(p.kind)
                const Icon = meta.icon
                const hasScore = p.total > 0
                return (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 transition-colors hover:border-border/70 hover:bg-card/70"
                  >
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${meta.ring}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {p.topic || meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{subjectLabel(p.subject)}</span>
                        <span>·</span>
                        <span>{meta.label}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-right">
                      {hasScore ? (
                        <span className="text-sm font-semibold">
                          {p.score}/{p.total}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          ✓
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo(p.completedAt)}
                      </span>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </GlassCard>

        {/* achievements preview */}
        <GlassCard className="p-5 sm:p-6" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">Достижения</h3>
                <p className="text-xs text-muted-foreground">
                  Открыто {unlockedAchievements.length} из {ACHIEVEMENTS.length}
                </p>
              </div>
            </div>
          </div>

          {unlockedAchievements.length === 0 ? (
            <EmptyState
              icon={Lock}
              title="Сундук закрыт"
              description="Первые награды уже ждут — сделай любой урок или квиз."
              action={
                <button
                  onClick={() => setView('achievements')}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Все достижения <ChevronRight className="h-3.5 w-3.5" />
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                {unlockedAchievements.slice(0, 6).map((a, i) => {
                  const def = ACHIEVEMENTS.find(
                    (x) => x.type === a.type
                  )
                  const Icon = ACHIEVEMENT_ICONS[a.type] || Sparkles
                  return (
                    <motion.div
                      key={a.type}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="group relative flex flex-col items-center gap-1 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-fuchsia-500/5 p-3 text-center"
                      title={def?.desc}
                    >
                      <div className="absolute -right-5 -top-5 h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-30 blur-xl transition-opacity group-hover:opacity-50" />
                      <div className="relative text-2xl">{def?.emoji || '🏆'}</div>
                      <div className="relative text-[10px] font-medium leading-tight text-foreground">
                        {def?.title || a.type}
                      </div>
                      <Icon className="relative h-3 w-3 text-primary/70" />
                    </motion.div>
                  )
                })}

                {/* placeholder for remaining locked slots */}
                {Array.from({
                  length: Math.max(0, 6 - unlockedAchievements.length),
                }).map((_, i) => (
                  <div
                    key={`locked-${i}`}
                    className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border/50 bg-muted/20 p-3 text-center"
                  >
                    <div className="grid h-8 w-8 place-items-center text-muted-foreground/60">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="text-[10px] text-muted-foreground/70">
                      закрыто
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setView('achievements')}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Все достижения
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </GlassCard>
      </div>

      {/* Share card modal */}
      <ShareCard
        open={shareOpen}
        onOpenChange={setShareOpen}
        achievements={progressData?.achievements ?? []}
      />
    </PageSection>
  )
}

/* ============================================================ *
 * Helpers: pluralization
 * ============================================================ */

function pluralDays(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня'
  return 'дней'
}
