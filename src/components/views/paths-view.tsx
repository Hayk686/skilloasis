'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Sparkles, Clock, Target, ArrowRight, Loader2, Route, CheckCircle2 } from 'lucide-react'
import { PageSection, SectionHeader, GlassCard, GradientButton, Pill, EmptyState } from '@/components/ui-blocks'
import { useNav } from '@/lib/store'
import { toast } from 'sonner'

interface PathStep { title: string; description: string }
interface LearningPath {
  goal: string
  emoji: string
  duration: string
  level: string
  steps: PathStep[]
}

const SUGGESTIONS = [
  'Освоить Python с нуля до автоматизации',
  'Понять линейную алгебру для ML',
  'Разговорный английский за 3 месяца',
  'Основы квантовой физики',
  'Стать frontend-разработчиком',
  'История древнего Рима',
]

export function PathsView() {
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState('Новичок')
  const [path, setPath] = useState<LearningPath | null>(null)
  const [loading, setLoading] = useState(false)
  const { setView, setSubject } = useNav()

  async function generate(g?: string) {
    const finalGoal = (g ?? goal).trim()
    if (!finalGoal) {
      toast.error('Опиши свою цель')
      return
    }
    setGoal(finalGoal)
    setLoading(true)
    setPath(null)
    try {
      const res = await fetch('/api/paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: finalGoal, level }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPath(data.path)
      toast.success('Маршрут построен!')
    } catch (e) {
      toast.error('Не удалось построить маршрут. Попробуй ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageSection className="py-8">
      <SectionHeader
        title="Маршруты обучения"
        subtitle="Опиши цель — AI построит пошаговый путь к ней"
        icon={Compass}
      />

      <GlassCard className="mb-6 p-5" hover={false}>
        <label className="mb-2 block text-sm font-medium">Какая у тебя цель?</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Например: освоить Python для анализа данных"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none ring-primary/20 transition focus:ring-2"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
            {['Новичок', 'Средний', 'Продвинутый'].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  level === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <GradientButton onClick={() => generate()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Строю маршрут...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Построить путь
              </>
            )}
          </GradientButton>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs text-muted-foreground">Или выбери идею:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => generate(s)}
                disabled={loading}
                className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PathSkeleton />
          </motion.div>
        )}

        {path && !loading && (
          <motion.div
            key="path"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <PathCard path={path} onStartStep={(title) => {
              setSubject('general')
              // pass topic via store-less mechanism: store in sessionStorage
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('lumina:lesson-topic', title)
              }
              setView('lessons')
            }} />
          </motion.div>
        )}

        {!path && !loading && (
          <EmptyState
            icon={Route}
            title="Здесь появится твой персональный маршрут"
            description="Опиши цель выше — и AI разобьёт её на конкретные шаги"
          />
        )}
      </AnimatePresence>
    </PageSection>
  )
}

function PathCard({
  path,
  onStartStep,
}: {
  path: LearningPath
  onStartStep: (title: string) => void
}) {
  return (
    <GlassCard className="overflow-hidden" hover={false}>
      <div className="relative border-b border-border/60 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 p-6">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-4xl shadow-lg">
              {path.emoji || '🧭'}
            </div>
            <div>
              <h3 className="text-xl font-bold sm:text-2xl">{path.goal}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill><Clock className="h-3 w-3" /> {path.duration || 'гибко'}</Pill>
                <Pill><Target className="h-3 w-3" /> {path.level}</Pill>
                <Pill><Route className="h-3 w-3" /> {path.steps.length} шагов</Pill>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ol className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {path.steps.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative flex gap-4"
            >
              <div className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-primary/40 bg-card text-sm font-bold text-primary">
                {i + 1}
              </div>
              <div className="flex-1 rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="font-semibold">{step.title}</p>
                {step.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                )}
                <button
                  onClick={() => onStartStep(step.title)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Начать изучение <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </GlassCard>
  )
}

function PathSkeleton() {
  return (
    <GlassCard className="overflow-hidden" hover={false}>
      <div className="border-b border-border/60 bg-muted/30 p-6">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-64 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
      <div className="space-y-3 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2 rounded-xl border border-border/60 p-4">
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
