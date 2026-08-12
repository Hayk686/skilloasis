'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  Home,
  LayoutDashboard,
  MessagesSquare,
  BookOpen,
  Trophy,
  Layers,
  Compass,
  Award,
  Lightbulb,
  Network,
  Loader2,
  ArrowRight,
  CornerDownLeft,
  Terminal,
} from 'lucide-react'
import { useNav, useUI, ViewId } from '@/lib/store'
import { SUBJECTS, localizeSubject, localizeSubjectLevel } from '@/lib/subjects'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { useTranslations } from '@/lib/i18n-client'

interface CmdItem {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  group: string
  action: () => void
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUI()
  const { setView, openSubject } = useNav()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [mode, setMode] = useState<'menu' | 'explain' | 'tts'>('menu')
  const [explainText, setExplainText] = useState('')
  const [explainLoading, setExplainLoading] = useState(false)
  const [explainResult, setExplainResult] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { locale, tr, t } = useTranslations()

  const navigationGroup = t('navigation')
  const actionsGroup = tr('Действия', 'Actions', 'Գործողություններ')
  const subjectsGroup = t('navSubjects')

  // Open via ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
      if (e.key === 'Escape' && mode !== 'menu') {
        setMode('menu')
        setExplainResult(null)
        setExplainText('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandOpen, mode])

  // Focus input when opened
  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => inputRef.current?.focus(), 60)
    } else {
      // reset on close
      setMode('menu')
      setQuery('')
      setActiveIndex(0)
      setExplainResult(null)
      setExplainText('')
    }
  }, [commandOpen])

  const goto = useCallback(
    (v: ViewId) => {
      setView(v)
      setCommandOpen(false)
    },
    [setView, setCommandOpen]
  )

  const items: CmdItem[] = [
    { id: 'home', label: t('navHome'), icon: Home, group: navigationGroup, action: () => goto('home') },
    { id: 'dash', label: t('navDashboard'), hint: tr('Прогресс и XP', 'Progress and XP', 'Առաջընթաց և XP'), icon: LayoutDashboard, group: navigationGroup, action: () => goto('dashboard') },
    { id: 'tutor', label: t('navTutor'), hint: tr('Чат', 'Chat', 'Զրույց'), icon: MessagesSquare, group: navigationGroup, action: () => goto('tutor') },
    { id: 'lessons', label: t('navLessons'), hint: tr('Интерактивные', 'Interactive', 'Ինտերակտիվ'), icon: BookOpen, group: navigationGroup, action: () => goto('lessons') },
    { id: 'quiz', label: t('navQuiz'), hint: t('navQuizDesc'), icon: Trophy, group: navigationGroup, action: () => goto('quiz') },
    { id: 'flash', label: t('navFlashcards'), hint: tr('Повторение', 'Review', 'Կրկնություն'), icon: Layers, group: navigationGroup, action: () => goto('flashcards') },
    { id: 'paths', label: t('navPaths'), hint: t('navPathsDesc'), icon: Compass, group: navigationGroup, action: () => goto('paths') },
    { id: 'subj', label: t('navSubjects'), hint: t('navSubjectsDesc'), icon: Sparkles, group: navigationGroup, action: () => goto('subjects') },
    { id: 'ach', label: t('navAchievements'), icon: Award, group: navigationGroup, action: () => goto('achievements') },
    { id: 'mindmap', label: t('navMindmap'), hint: tr('Концепт-карты', 'Concept maps', 'Հասկացությունների քարտեզներ'), icon: Network, group: navigationGroup, action: () => goto('mindmap') },
    { id: 'playground', label: t('navPlayground'), hint: '9 languages + AI', icon: Terminal, group: navigationGroup, action: () => goto('playground') },
    {
      id: 'explain',
      label: tr('Объяснить концепцию…', 'Explain a concept…', 'Բացատրել հասկացությունը…'),
      hint: tr('AI объяснит просто', 'AI will make it simple', 'AI-ը պարզ կբացատրի'),
      icon: Lightbulb,
      group: actionsGroup,
      action: () => {
        setMode('explain')
        setQuery('')
      },
    },
    ...SUBJECTS.map((s) => {
      const subject = localizeSubject(s, locale)
      return {
        id: `subj-${s.id}`,
        label: subject.name,
        hint: localizeSubjectLevel(s.level, locale),
        icon: Sparkles,
        group: subjectsGroup,
        action: () => {
          openSubject(s.id)
          setCommandOpen(false)
        },
      }
    }),
  ]

  const filtered = query.trim()
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.hint?.toLowerCase().includes(query.toLowerCase())
      )
    : items

  // group filtered
  const groups: Record<string, CmdItem[]> = {}
  for (const it of filtered) {
    ;(groups[it.group] ||= []).push(it)
  }
  const flatFiltered = Object.values(groups).flatMap((itemsInGroup) => itemsInGroup)

  // keep active index in range
  useEffect(() => {
    if (activeIndex >= flatFiltered.length) setActiveIndex(0)
  }, [flatFiltered.length, activeIndex])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(flatFiltered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatFiltered[activeIndex]
      if (item) item.action()
    } else if (e.key === 'Escape') {
      setCommandOpen(false)
    }
  }

  // scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  async function runExplain() {
    const concept = query.trim() || explainText.trim()
    if (!concept) {
      toast.error(tr('Введите концепцию для объяснения', 'Enter a concept to explain', 'Մուտքագրեք բացատրության ենթակա հասկացությունը'))
      return
    }
    setExplainLoading(true)
    setExplainResult(null)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExplainResult(data.text)
    } catch {
      toast.error(tr('Не удалось объяснить. Попробуйте ещё раз.', 'Could not generate an explanation. Please try again.', 'Չհաջողվեց ստեղծել բացատրությունը։ Փորձեք կրկին։'))
    } finally {
      setExplainLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {commandOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-2 pt-3 backdrop-blur-md sm:p-4 sm:pt-[12vh]"
          onClick={() => setCommandOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* gradient top border */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            {mode === 'menu' && (
              <>
                <div className="flex items-center gap-3 border-b border-border/60 px-4">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setActiveIndex(0)
                    }}
                    onKeyDown={onKeyDown}
                    placeholder={tr('Найти раздел, предмет или объяснить концепцию…', 'Find a section, subject, or explain a concept…', 'Գտնել բաժին, առարկա կամ բացատրել հասկացություն…')}
                    className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <kbd className="hidden rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                    ESC
                  </kbd>
                </div>

                <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
                  {flatFiltered.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      {tr('Ничего не найдено. Попробуйте «объяснить» для AI-разбора.', 'Nothing found. Try “explain” for an AI explanation.', 'Ոչինչ չի գտնվել։ Փորձեք «բացատրել» AI վերլուծության համար։')}
                    </div>
                  )}
                  {Object.entries(groups).map(([group, arr]) => (
                    <div key={group} className="mb-1">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group}
                      </p>
                      {arr.map((item) => {
                        const idx = flatFiltered.indexOf(item)
                        const Icon = item.icon
                        const isActive = idx === activeIndex
                        return (
                          <button
                            key={item.id}
                            data-idx={idx}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={item.action}
                            className={cn(
                              'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                              isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div
                              className={cn(
                                'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
                                isActive
                                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                                  : 'bg-muted/50 text-muted-foreground'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.label}</p>
                              {item.hint && (
                                <p className="truncate text-xs text-muted-foreground">{item.hint}</p>
                              )}
                            </div>
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5">↑↓</kbd>
                      {tr('навигация', 'navigate', 'նավարկում')}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5">↵</kbd>
                      {tr('выбор', 'select', 'ընտրել')}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Info Oasis Command
                  </span>
                </div>
              </>
            )}

            {mode === 'explain' && (
              <div className="flex flex-col">
                <div className="flex items-center gap-3 border-b border-border/60 px-4">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') runExplain()
                      if (e.key === 'Escape') setMode('menu')
                    }}
                    placeholder={tr('Что объяснить? Например: «квантовая суперпозиция»', 'What should I explain? For example: “quantum superposition”', 'Ի՞նչ բացատրել։ Օրինակ՝ «քվանտային սուպերպոզիցիա»')}
                    className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={runExplain}
                    disabled={explainLoading || !query.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {explainLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {tr('Объяснить', 'Explain', 'Բացատրել')}
                  </button>
                </div>

                <div className="max-h-[55vh] overflow-y-auto p-4">
                  {explainLoading && (
                    <div className="space-y-2">
                      {[100, 92, 96, 80, 88, 70].map((w, i) => (
                        <div
                          key={i}
                          className="h-3 animate-pulse rounded bg-muted"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  )}
                  {!explainLoading && !explainResult && (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                        <Lightbulb className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="font-medium">{tr('Объясни что угодно', 'Explain anything', 'Բացատրել ցանկացած բան')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {tr('Введите концепцию — AI объяснит её простыми словами с аналогией и примером.', 'Enter a concept and AI will explain it simply with an analogy and example.', 'Մուտքագրեք հասկացությունը, և AI-ը այն պարզ կբացատրի համեմատությամբ ու օրինակով։')}
                        </p>
                      </div>
                    </div>
                  )}
                  {!explainLoading && explainResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose-ai"
                    >
                      <ReactMarkdown>{explainResult}</ReactMarkdown>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground">
                  <button
                    onClick={() => {
                      setMode('menu')
                      setExplainResult(null)
                    }}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <ArrowRight className="h-3 w-3 rotate-180" /> {tr('Назад', 'Back', 'Հետ')}
                  </button>
                  <span>ESC — {tr('назад', 'back', 'հետ')}</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
