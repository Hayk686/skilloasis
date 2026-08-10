'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useNav, useUser } from '@/lib/store'
import { SUBJECTS } from '@/lib/subjects'
import {
  PageSection,
  SectionHeader,
  GlassCard,
  GradientButton,
  LoadingState,
  EmptyState,
} from '@/components/ui-blocks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
}

const SUGGESTIONS = [
  'Нейронные сети',
  'Квантовая механика',
  'Французская революция',
  'Теория относительности',
  'Экосистема океана',
  'Основы дизайна',
  'Стоицизм',
  'ДНК и генетика',
]

const BRANCH_COLORS = [
  { bg: 'from-violet-500 to-fuchsia-500', ring: 'ring-violet-500/40', text: 'text-violet-300', line: 'stroke-violet-500' },
  { bg: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-500/40', text: 'text-emerald-300', line: 'stroke-emerald-500' },
  { bg: 'from-amber-500 to-orange-500', ring: 'ring-amber-500/40', text: 'text-amber-300', line: 'stroke-amber-500' },
  { bg: 'from-rose-500 to-pink-500', ring: 'ring-rose-500/40', text: 'text-rose-300', line: 'stroke-rose-500' },
  { bg: 'from-sky-500 to-cyan-500', ring: 'ring-sky-500/40', text: 'text-sky-300', line: 'stroke-sky-500' },
  { bg: 'from-fuchsia-500 to-purple-500', ring: 'ring-fuchsia-500/40', text: 'text-fuchsia-300', line: 'stroke-fuchsia-500' },
  { bg: 'from-green-500 to-lime-500', ring: 'ring-green-500/40', text: 'text-green-300', line: 'stroke-green-500' },
]

export function MindMapView() {
  const [topic, setTopic] = useState('')
  const [map, setMap] = useState<{ root: MindMapNode } | null>(null)
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const { setView, activeSubject, setSubject } = useNav()
  const { xp, level } = useUser()

  // Prefill subject
  useEffect(() => {
    if (activeSubject) {
      const s = SUBJECTS.find((s) => s.id === activeSubject)
      if (s) setTopic(s.topics[0] || s.ru)
    }
  }, [activeSubject])

  const generate = useCallback(async (t?: string) => {
    const finalTopic = (t ?? topic).trim()
    if (!finalTopic) {
      toast.error('Введите тему для карты')
      return
    }
    setTopic(finalTopic)
    setLoading(true)
    setMap(null)
    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: finalTopic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMap(data.map)
      useUser.setState({ xp: data.xp ?? xp, level: data.level ?? level })
      toast.success('+10 XP за карту знаний!')
    } catch {
      toast.error('Не удалось создать карту. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }, [topic, xp, level])

  return (
    <PageSection className="py-8">
      <SectionHeader
        title="Карты знаний"
        subtitle="Визуальная карта концепций — увидь связи между идеями"
        icon={Network}
      />

      {/* Input */}
      <GlassCard className="mb-6 p-5" hover={false}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Тема</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder="Например: нейронные сети, теория относительности…"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none ring-primary/20 transition focus:ring-2"
            />
          </div>
          <GradientButton onClick={() => generate()} disabled={loading || !topic.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Создаю карту…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Создать карту
              </>
            )}
          </GradientButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => generate(s)}
              disabled={loading}
              className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Map rendering */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingState label="AI строит карту знаний…" />
          </motion.div>
        )}

        {map && !loading && (
          <motion.div key="map" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <MindMapRenderer map={map} zoom={zoom} onTopicClick={(t) => {
              setSubject('general')
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('lumina:lesson-topic', t)
              }
              setView('lessons')
            }} />
          </motion.div>
        )}

        {!map && !loading && (
          <EmptyState
            icon={Network}
            title="Визуализируй свои знания"
            description="Введи тему — AI построит интерактивную карту концепций с цветовыми ветками и связями"
          />
        )}
      </AnimatePresence>

      {/* Zoom controls */}
      {map && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </PageSection>
  )
}

/* =================== Tree renderer =================== */

function MindMapRenderer({
  map,
  zoom,
  onTopicClick,
}: {
  map: { root: MindMapNode }
  zoom: number
  onTopicClick: (label: string) => void
}) {
  const root = map.root
  const children = root.children ?? []

  return (
    <div className="overflow-auto rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
      <div
        className="relative p-6 transition-transform duration-300"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      >
        {/* Root node */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            <div className="relative z-10 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-3 text-center text-white shadow-xl shadow-fuchsia-500/30">
              <p className="text-lg font-bold">{root.label}</p>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 blur-xl opacity-40 -z-10" />
          </motion.div>
        </div>

        {/* Branch grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children.map((child, i) => {
            const color = BRANCH_COLORS[i % BRANCH_COLORS.length]
            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <BranchCard node={child} color={color} depth={1} onTopicClick={onTopicClick} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BranchCard({
  node,
  color,
  depth,
  onTopicClick,
}: {
  node: MindMapNode
  color: typeof BRANCH_COLORS[number]
  depth: number
  onTopicClick: (label: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        depth === 1
          ? 'border-border/60 bg-card/60 hover:border-primary/30'
          : 'border-border/40 bg-background/30'
      )}
    >
      {/* Node header */}
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          else onTopicClick(node.label)
        }}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        {depth === 1 && (
          <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br', color.bg)} />
        )}
        <span className={cn('flex-1 text-sm font-medium', depth === 1 ? 'text-foreground' : 'text-muted-foreground')}>
          {node.label}
        </span>
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onTopicClick(node.label) }}
            className="grid h-6 w-6 place-items-center rounded-md text-primary hover:bg-primary/10"
            aria-label={`Изучить ${node.label}`}
          >
            <BookOpen className="h-3 w-3" />
          </button>
        )}
      </button>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 px-3 py-1.5 space-y-0.5">
              {node.children!.map((child, ci) => (
                <BranchCard
                  key={child.id}
                  node={child}
                  color={BRANCH_COLORS[ci % BRANCH_COLORS.length]}
                  depth={depth + 1}
                  onTopicClick={onTopicClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
