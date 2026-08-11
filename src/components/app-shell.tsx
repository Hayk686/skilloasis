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
  Languages,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNav, useUI, useUser, ViewId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { AuroraBackground } from '@/components/aurora'
import { Footer } from '@/components/footer'
import { CommandPalette } from '@/components/command-palette'
import { useLocaleSync, useTranslations, type TranslationKey } from '@/lib/i18n-client'
import { AuthDialog } from '@/components/auth-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { localizeUserName } from '@/lib/i18n-config'

const NAV_ITEMS: { id: ViewId; label: TranslationKey; icon: typeof Home; desc: TranslationKey }[] = [
  { id: 'home', label: 'navHome', icon: Home, desc: 'navHomeDesc' },
  { id: 'dashboard', label: 'navDashboard', icon: LayoutDashboard, desc: 'navDashboardDesc' },
  { id: 'tutor', label: 'navTutor', icon: MessagesSquare, desc: 'navTutorDesc' },
  { id: 'lessons', label: 'navLessons', icon: BookOpen, desc: 'navLessonsDesc' },
  { id: 'quiz', label: 'navQuiz', icon: Trophy, desc: 'navQuizDesc' },
  { id: 'flashcards', label: 'navFlashcards', icon: Layers, desc: 'navFlashcardsDesc' },
  { id: 'paths', label: 'navPaths', icon: Compass, desc: 'navPathsDesc' },
  { id: 'mindmap', label: 'navMindmap', icon: Network, desc: 'navMindmapDesc' },
  { id: 'playground', label: 'navPlayground', icon: Terminal, desc: 'navPlaygroundDesc' },
  { id: 'subjects', label: 'navSubjects', icon: Sparkles, desc: 'navSubjectsDesc' },
  { id: 'achievements', label: 'navAchievements', icon: Award, desc: 'navAchievementsDesc' },
]

function ThemeToggle() {
  const { t } = useTranslations()
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
      aria-label={t('theme')}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground lg:h-9 lg:w-9 lg:rounded-lg"
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
  useLocaleSync()
  const { locale, locales, languageNames, setLocale, t, tr } = useTranslations()
  const { view, setView } = useNav()
  const { sidebarOpen, setSidebar, setCommandOpen } = useUI()
  const { xp, level, streak, name, authenticated } = useUser()
  const [authOpen, setAuthOpen] = useState(false)
  const displayName = localizeUserName(name, locale)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [view])

  useEffect(() => {
    if (!sidebarOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebar(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [setSidebar, sidebarOpen])

  return (
    <div className="relative flex min-h-screen flex-col">
      <AuroraBackground />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground xl:hidden"
            aria-label={t('menu')}
            aria-expanded={sidebarOpen}
            aria-controls="mobile-navigation"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setView('home')}
            className="flex shrink-0 items-center gap-2 sm:gap-2.5"
          >
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
              <Sparkles className="h-4.5 w-4.5" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 blur-md opacity-50 -z-10" />
            </div>
            <div className="text-left">
              <p className="text-base font-bold leading-none tracking-tight">SkillOasis</p>
              <p className="mt-0.5 hidden text-[11px] leading-none text-muted-foreground sm:block">
                {t('tagline')}
              </p>
            </div>
          </button>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 xl:flex">
              <StatPill icon={Flame} value={streak} label={t('days')} />
              <StatPill icon={Zap} value={xp} label="XP" />
              <StatPill icon={Sparkles} value={level} label={t('levelShort')} />
            </div>
            <button
              onClick={() => setCommandOpen(true)}
              aria-label={t('search')}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground transition-colors hover:border-border hover:text-foreground md:flex lg:h-9 lg:w-9 lg:rounded-lg"
            >
              <Search className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t('language')}
                  className="hidden h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-3 text-xs transition-colors hover:border-border hover:text-foreground md:flex lg:h-9 lg:rounded-lg lg:px-2.5"
                >
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{languageNames[locale]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuRadioGroup
                  value={locale}
                  onValueChange={(value) => setLocale(value as typeof locale)}
                >
                  {locales.map((item) => (
                    <DropdownMenuRadioItem key={item} value={item}>
                      {languageNames[item]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              aria-label={authenticated ? displayName : t('account')}
              className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-border/60 bg-card/60 px-2 transition-colors hover:border-primary/40 hover:bg-card lg:h-9"
            >
              <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden max-w-24 truncate text-xs font-medium sm:inline">{displayName}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        {/* Sidebar (desktop) */}
        <div className="hidden w-64 shrink-0 xl:block">
          <aside className="fixed top-16 z-30 h-[calc(100dvh-4rem)] w-64 overflow-hidden border-r border-border/40 bg-background/80 px-3 py-6 backdrop-blur-xl">
            <SidebarContent active={view} onSelect={setView} />
          </aside>
        </div>

        {/* Sidebar (mobile drawer) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebar(false)}
                className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm xl:hidden"
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                id="mobile-navigation"
                className="fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,20rem)] flex-col overflow-hidden border-r border-border bg-background/98 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl xl:hidden"
              >
                <div className="mb-3 flex shrink-0 items-center justify-between border-b border-border/60 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setView('home')
                      setSidebar(false)
                    }}
                    className="flex items-center gap-2.5 rounded-xl px-1 text-left"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
                      <Sparkles className="h-4.5 w-4.5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">SkillOasis</span>
                      <span className="block text-[11px] text-muted-foreground">{t('tagline')}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebar(false)}
                    aria-label={tr('Закрыть меню', 'Close menu', 'Փակել ընտրացանկը')}
                    className="grid h-11 w-11 place-items-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-3 grid shrink-0 grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSidebar(false)
                      setCommandOpen(true)
                    }}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 text-sm font-medium text-muted-foreground"
                  >
                    <Search className="h-4 w-4" />
                    {t('search')}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 text-sm font-medium"
                      >
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{languageNames[locale]}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-40">
                      <DropdownMenuRadioGroup
                        value={locale}
                        onValueChange={(value) => setLocale(value as typeof locale)}
                      >
                        {locales.map((item) => (
                          <DropdownMenuRadioItem key={item} value={item}>
                            {languageNames[item]}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="min-h-0 flex-1">
                  <SidebarContent
                    active={view}
                    onSelect={(v) => {
                      setView(v)
                      setSidebar(false)
                    }}
                  />
                </div>
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

      {view === 'home' && <Footer />}

      {/* Global command palette */}
      <CommandPalette />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
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
  const { t } = useTranslations()
  const renderNavItem = (item: (typeof NAV_ITEMS)[number]) => {
    const Icon = item.icon
    const isActive = active === item.id
    return (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={cn(
          'group relative flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
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
            'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
            isActive
              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
              : 'bg-muted/60 text-muted-foreground group-hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{t(item.label)}</p>
          <p className="truncate text-[11px] text-muted-foreground">{t(item.desc)}</p>
        </div>
      </button>
    )
  }

  return (
    <nav className="flex h-full min-h-0 flex-col" aria-label={t('navigation')}>
      <p className="shrink-0 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('navigation')}
      </p>
      <div className="-mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-1 pb-3">
        {NAV_ITEMS.map(renderNavItem)}
      </div>

      <div className="mt-3 shrink-0 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 p-3">
        <p className="text-xs font-semibold">{t('freeTitle')}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {t('freeDescription')}
        </p>
      </div>
    </nav>
  )
}
