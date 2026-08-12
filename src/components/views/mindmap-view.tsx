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
import { SUBJECTS, localizeSubject } from '@/lib/subjects'
import {
  PageSection,
  SectionHeader,
  GradientButton,
  LoadingState,
  EmptyState,
} from '@/components/ui-blocks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
}

const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

const SUGGESTIONS = [
  localized('Нейронные сети', 'Neural networks', 'Նեյրոնային ցանցեր'),
  localized('Квантовая механика', 'Quantum mechanics', 'Քվանտային մեխանիկա'),
  localized('Французская революция', 'French Revolution', 'Ֆրանսիական հեղափոխություն'),
  localized('Теория относительности', 'Theory of relativity', 'Հարաբերականության տեսություն'),
  localized('Экосистема океана', 'Ocean ecosystem', 'Օվկիանոսի էկոհամակարգ'),
  localized('Основы дизайна', 'Design fundamentals', 'Դիզայնի հիմունքներ'),
  localized('Стоицизм', 'Stoicism', 'Ստոիցիզմ'),
  localized('ДНК и генетика', 'DNA and genetics', 'ԴՆԹ և գենետիկա'),
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
  const { locale, tr, localize } = useTranslations()
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
      if (s) {
        const subject = localizeSubject(s, locale)
        setTopic(subject.topics[0] || subject.name)
      }
    }
  }, [activeSubject, locale])

  const generate = useCallback(async (t?: string) => {
    const finalTopic = (t ?? topic).trim()
    if (!finalTopic) {
      toast.error(tr('Введите тему для карты', 'Enter a topic for the map', 'Մուտքագրեք քարտեզի թեման'))
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
      toast.success(tr('+10 XP за карту знаний!', '+10 XP for your knowledge map!', '+10 XP գիտելիքի քարտեզի համար։'))
    } catch {
      toast.error(tr('Не удалось создать карту. Попробуйте ещё раз.', 'Could not create the map. Please try again.', 'Չհաջողվեց ստեղծել քարտեզը։ Փորձեք կրկին։'))
    } finally {
      setLoading(false)
    }
  }, [topic, xp, level, tr])

  return (
    <PageSection className="py-8">
      <SectionHeader
        title={tr('Карты знаний', 'Knowledge maps', 'Գիտելիքի քարտեզներ')}
        subtitle={tr('Визуальная карта концепций — увидь связи между идеями', 'Visualize concepts and discover the connections between ideas', 'Տեսողական դարձրու հասկացությունները և բացահայտիր գաղափարների կապերը')}
        icon={Network}
      />

      {/* Input */}
      <section className="map-glass-panel mb-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{tr('Тема', 'Topic', 'Թեմա')}</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder={tr('Например: нейронные сети, теория относительности…', 'For example: neural networks, theory of relativity…', 'Օրինակ՝ նեյրոնային ցանցեր, հարաբերականության տեսություն…')}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none ring-primary/20 transition focus:ring-2"
            />
          </div>
          <GradientButton className="w-full sm:w-auto" onClick={() => generate()} disabled={loading || !topic.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {tr('Создаю карту…', 'Creating map…', 'Ստեղծում ենք քարտեզը…')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {tr('Создать карту', 'Create map', 'Ստեղծել քարտեզ')}
              </>
            )}
          </GradientButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => {
            const text = localize(suggestion)
            return (
            <button
              key={text}
              onClick={() => generate(text)}
              disabled={loading}
              className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {text}
            </button>
            )
          })}
        </div>
      </section>

      {/* Map rendering */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingState label={tr('AI строит карту знаний…', 'AI is building your knowledge map…', 'AI-ը կառուցում է գիտելիքի քարտեզը…')} />
          </motion.div>
        )}

        {map && !loading && (
          <motion.div key="map" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <MindMapRenderer map={map} zoom={zoom} onTopicClick={(t) => {
              setSubject('general')
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('info-oasis:lesson-topic', t)
              }
              setView('lessons')
            }} />
          </motion.div>
        )}

        {!map && !loading && (
          <EmptyState
            icon={Network}
            title={tr('Визуализируй свои знания', 'Visualize your knowledge', 'Տեսողական դարձրու գիտելիքներդ')}
            description={tr('Введи тему — AI построит интерактивную карту концепций с цветовыми ветками и связями', 'Enter a topic and AI will build an interactive map of concepts and connections', 'Մուտքագրեք թեման, և AI-ը կկառուցի հասկացությունների ու կապերի ինտերակտիվ քարտեզ')}
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
    <div className="map-glass-panel max-w-full overflow-auto overscroll-contain rounded-2xl">
      <div
        className="relative p-4 transition-transform duration-300 sm:p-6"
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
  const { tr } = useTranslations()
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div
      className={cn(
        'map-glass-node rounded-xl border transition-all',
        depth === 1
          ? 'border-border/60 hover:border-primary/30'
          : 'border-border/40'
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
            aria-label={`${tr('Изучить', 'Study', 'Ուսումնասիրել')} ${node.label}`}
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
