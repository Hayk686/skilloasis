'use client'

import { Component, type ReactNode, useEffect, lazy, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useNav, useUser } from '@/lib/store'
import { useUserSync } from '@/hooks/use-user-sync'
import { HomeView } from '@/components/views/home-view'
import { SubjectsView } from '@/components/views/subjects-view'
import { PathsView } from '@/components/views/paths-view'
import { AchievementsView } from '@/components/views/achievements-view'
import { LoadingState } from '@/components/ui-blocks'
import { useTranslations } from '@/lib/i18n-client'
import type { ViewId } from '@/lib/store'
import { getSeoByPath, VIEW_SEO } from '@/lib/seo'
import { ClientSeo } from '@/components/client-seo'
import { PageJsonLd } from '@/components/seo-json-ld'

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
  { children: ReactNode; title: string; fallback: string; retry: string },
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
          <p className="text-lg font-semibold">{this.props.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error?.message || this.props.fallback}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {this.props.retry}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home({ initialView = 'home' }: { initialView?: ViewId }) {
  const { t } = useTranslations()
  const pathname = usePathname()
  const { view: storedView } = useNav()
  const { hydrated } = useUser()
  const view = getSeoByPath(pathname)?.view ?? initialView ?? storedView
  const seo = VIEW_SEO[view]
  useUserSync()

  // Scroll to top on view change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view])

  return (
    <AppShell activeView={view}>
      <ClientSeo page={seo} />
      <PageJsonLd page={seo} />
      {!hydrated ? (
        <ViewFallback label={t('loadProfile')} />
      ) : (
        <>
          {view === 'home' && <HomeView />}
          {view === 'dashboard' && (
            <Suspense fallback={<ViewFallback label={t('loadDashboard')} />}>
              <ViewErrorBoundary title={t('errorTitle')} fallback={t('errorFallback')} retry={t('retry')}>
                <DashboardView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'tutor' && (
            <Suspense fallback={<ViewFallback label={t('loadTutor')} />}>
              <ViewErrorBoundary title={t('errorTitle')} fallback={t('errorFallback')} retry={t('retry')}>
                <TutorView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'lessons' && (
            <Suspense fallback={<ViewFallback label={t('loadLesson')} />}>
              <ViewErrorBoundary title={t('errorTitle')} fallback={t('errorFallback')} retry={t('retry')}>
                <LessonsView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'quiz' && (
            <Suspense fallback={<ViewFallback label={t('loadQuiz')} />}>
              <ViewErrorBoundary title={t('errorTitle')} fallback={t('errorFallback')} retry={t('retry')}>
                <QuizView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'flashcards' && (
            <Suspense fallback={<ViewFallback label={t('loadFlashcards')} />}>
              <ViewErrorBoundary title={t('errorTitle')} fallback={t('errorFallback')} retry={t('retry')}>
                <FlashcardsView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'paths' && <PathsView />}
          {view === 'subjects' && <SubjectsView />}
          {view === 'achievements' && <AchievementsView />}
          {view === 'mindmap' && (
            <Suspense fallback={<ViewFallback label={t('loadMindmap')} />}>
              <ViewErrorBoundary title={t('errorTitle')} fallback={t('errorFallback')} retry={t('retry')}>
                <MindMapView />
              </ViewErrorBoundary>
            </Suspense>
          )}
          {view === 'playground' && (
            <Suspense fallback={<ViewFallback label={t('loadPlayground')} />}>
              <ViewErrorBoundary title={t('errorTitle')} fallback={t('errorFallback')} retry={t('retry')}>
                <PlaygroundView />
              </ViewErrorBoundary>
            </Suspense>
          )}
        </>
      )}
    </AppShell>
  )
}
