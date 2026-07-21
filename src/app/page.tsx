'use client'

import { Component, type ReactNode, useEffect, lazy, Suspense } from 'react'
import { AppShell } from '@/components/app-shell'
import { useNav, useUser } from '@/lib/store'
import { useUserSync } from '@/hooks/use-user-sync'
import { HomeView } from '@/components/views/home-view'
import { SubjectsView } from '@/components/views/subjects-view'
import { PathsView } from '@/components/views/paths-view'
import { AchievementsView } from '@/components/views/achievements-view'
import { LoadingState } from '@/components/ui-blocks'

const DashboardView = lazy(() =>
  import('@/components/views/dashboard-view').then((m) => ({ default: m.DashboardView }))
)
const TutorView = lazy(() =>
  import('@/components/views/tutor-view').then((m) => ({ default: m.TutorView }))
)
const LessonsView = lazy(() =>
  import('@/components/views/lessons-view').then((m) => ({ default: m.LessonsView }))
)
const QuizView = lazy(() =>
  import('@/components/views/quiz-view').then((m) => ({ default: m.QuizView }))
)
const FlashcardsView = lazy(() =>
  import('@/components/views/flashcards-view').then((m) => ({ default: m.FlashcardsView }))
)
const MindMapView = lazy(() =>
  import('@/components/views/mindmap-view').then((m) => ({ default: m.MindMapView }))
)
const PlaygroundView = lazy(() =>
  import('@/components/views/playground-view').then((m) => ({ default: m.PlaygroundView }))
)

function ViewFallback({ label }: { label: string }) {
  return <LoadingState label={label} />
}

/** Error boundary that catches render errors in individual views */
class ViewErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold">Что-то пошло не так</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error?.message || 'Не удалось загрузить раздел'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home() {
  const { view } = useNav()
  const { hydrated } = useUser()
  useUserSync()

  // Scroll to top on view change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view])

  return (
    <AppShell>
      {!hydrated ? (
        <ViewFallback label="Загружаем твой профиль..." />
      ) : (
        <>
          {view === 'home' && <HomeView />}
          {view === 'dashboard' && (
            <Suspense fallback={<ViewFallback label="Открываем дашборд..." />}>
              <ViewErrorBoundary>
                <DashboardView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'tutor' && (
            <Suspense fallback={<ViewFallback label="Подключаем наставника..." />}>
              <ViewErrorBoundary>
                <TutorView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'lessons' && (
            <Suspense fallback={<ViewFallback label="Готовим урок..." />}>
              <ViewErrorBoundary>
                <LessonsView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'quiz' && (
            <Suspense fallback={<ViewFallback label="Готовим квиз..." />}>
              <ViewErrorBoundary>
                <QuizView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'flashcards' && (
            <Suspense fallback={<ViewFallback label="Готовим флешкарты..." />}>
              <ViewErrorBoundary>
                <FlashcardsView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'paths' && <PathsView />}
          {view === 'subjects' && <SubjectsView />}
          {view === 'achievements' && <AchievementsView />}
          {view === 'mindmap' && (
            <Suspense fallback={<ViewFallback label="Строим карту знаний..." />}>
              <ViewErrorBoundary>
                <MindMapView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'playground' && (
            <Suspense fallback={<ViewFallback label="Открываем песочницу..." />}>
              <ViewErrorBoundary>
                <PlaygroundView />
              </ViewErrorBoundary>
            </Suspense>
          )}
        </>
      )}
    </AppShell>
  )
}
