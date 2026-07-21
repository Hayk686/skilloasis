'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  LayoutDashboard,
  MessagesSquare,
  BookOpen,
  Trophy,
  Layers,
  Sparkles,
  Compass,
  Award,
  Menu,
  X,
  Sun,
  Moon,
  Flame,
  Zap,
  Search,
  Network,
  Terminal,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNav, useUI, useUser, ViewId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { AuroraBackground } from '@/components/aurora'
import { Footer } from '@/components/footer'
import { CommandPalette, CommandTrigger } from '@/components/command-palette'

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof Home; desc: string }[] = [
  { id: 'home', label: 'Главная', icon: Home, desc: 'Стартовая страница' },
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, desc: 'Ваш прогресс' },
  { id: 'tutor', label: 'AI-наставник', icon: MessagesSquare, desc: 'Чат с наставником' },
  { id: 'lessons', label: 'Уроки', icon: BookOpen, desc: 'Интерактивные уроки' },
  { id: 'quiz', label: 'Квиз-арена', icon: Trophy, desc: 'Проверь себя' },
  { id: 'flashcards', label: 'Флешкарты', icon: Layers, desc: 'Интервальное повторение' },
  { id: 'paths', label: 'Маршруты', icon: Compass, desc: 'Путь к цели' },
  { id: 'mindmap', label: 'Карты знаний', icon: Network, desc: 'Визуальные концепт-карты' },
  { id: 'playground', label: 'Песочница кода', icon: Terminal, desc: 'JavaScript + AI-наставник' },
  { id: 'subjects', label: 'Предметы', icon: Sparkles, desc: 'Все области' },
  { id: 'achievements', label: 'Достижения', icon: Award, desc: 'Награды' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // mount detection to avoid hydration mismatch for theme toggle
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])
  if (!mounted) return <div className="h-9 w-9" />
  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Сменить тему"
      className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

function StatPill({ icon: Icon, value, label }: { icon: typeof Flame; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, setView } = useNav()
  const { sidebarOpen, setSidebar, setCommandOpen } = useUI()
  const { xp, level, streak, name } = useUser()

  return (
    <div className="relative flex min-h-screen flex-col">
      <AuroraBackground />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Меню"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2.5"
          >
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
              <Sparkles className="h-4.5 w-4.5" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 blur-md opacity-50 -z-10" />
            </div>
            <div className="text-left">
              <p className="text-base font-bold leading-none tracking-tight">Lumina</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                учись всему
              </p>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <StatPill icon={Flame} value={streak} label="дней" />
              <StatPill icon={Zap} value={xp} label="XP" />
              <StatPill icon={Sparkles} value={level} label="ур." />
            </div>
            <button
              onClick={() => setCommandOpen(true)}
              aria-label="Поиск"
              className="hidden h-9 items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Поиск</span>
              <kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <ThemeToggle />
            <div className="hidden h-9 items-center gap-2 rounded-full border border-border/60 bg-card/60 px-2 pr-3 sm:flex">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium">{name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border/40 bg-background/40 px-3 py-6 backdrop-blur-sm lg:block">
          <SidebarContent active={view} onSelect={setView} />
        </aside>

        {/* Sidebar (mobile drawer) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebar(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background p-4 pt-20 lg:hidden"
              >
                <SidebarContent
                  active={view}
                  onSelect={(v) => {
                    setView(v)
                    setSidebar(false)
                  }}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />

      {/* Global command palette + floating trigger */}
      <CommandPalette />
      <CommandTrigger />
    </div>
  )
}

function SidebarContent({
  active,
  onSelect,
}: {
  active: ViewId
  onSelect: (v: ViewId) => void
}) {
  return (
    <nav className="flex h-full flex-col gap-1">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Навигация
      </p>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
              isActive
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active"
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
              />
            )}
            <div
              className={cn(
                'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                isActive
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
                  : 'bg-muted/60 text-muted-foreground group-hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{item.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
          </button>
        )
      })}

      <div className="mt-auto rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 p-3">
        <p className="text-xs font-semibold">100% бесплатно</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Никаких подписок и платных функций. Знания принадлежат всем.
        </p>
      </div>
    </nav>
  )
}
