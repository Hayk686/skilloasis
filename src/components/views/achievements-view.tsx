'use client'

import { useEffect, useState } from 'react'
import { Award, Lock, Trophy, Flame, Zap, Sparkles, Brain, MessageSquare, Layers, Rocket, Gem, Globe, Headphones, Network, Terminal, Share2 } from 'lucide-react'
import { PageSection, SectionHeader, GlassCard, LoadingState, Pill } from '@/components/ui-blocks'
import { ACHIEVEMENTS } from '@/lib/gamify-client'
import { useUser } from '@/lib/store'

interface AchievementRow { type: string; unlockedAt: string }

export function AchievementsView() {
  const { userId } = useUser()
  const [unlocked, setUnlocked] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/progress', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const map: Record<string, string> = {}
        for (const a of data.achievements as AchievementRow[]) {
          map[a.type] = a.unlockedAt
        }
        setUnlocked(map)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const unlockedCount = Object.keys(unlocked).length
  const total = ACHIEVEMENTS.length
  const pct = Math.round((unlockedCount / total) * 100)

  const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    first_lesson: Brain,
    first_quiz: Trophy,
    first_chat: MessageSquare,
    first_flashcard: Layers,
    first_audio: Headphones,
    first_mindmap: Network,
    first_code: Terminal,
    first_share: Share2,
    streak_3: Flame,
    streak_7: Zap,
    level_5: Rocket,
    xp_1000: Gem,
    polyglot: Globe,
    quiz_perfect: Award,
  }

  return (
    <PageSection className="py-8">
      <SectionHeader
        title="Достижения"
        subtitle="Твои награды за упорство и любопытство"
        icon={Award}
      />

      {/* Progress overview */}
      <GlassCard className="mb-6 p-6" hover={false}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Открыто достижений</p>
            <p className="text-3xl font-bold">
              {unlockedCount} <span className="text-lg text-muted-foreground">/ {total}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Прогресс</p>
            <p className="text-3xl font-bold text-gradient">{pct}%</p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </GlassCard>

      {loading ? (
        <LoadingState label="Загружаем награды..." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ACHIEVEMENTS.map((a, i) => {
            const isUnlocked = !!unlocked[a.type]
            const Icon = ICONS[a.type] || Sparkles
            return (
              <div
                key={a.type}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-center transition-all ${
                  isUnlocked
                    ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-fuchsia-500/5'
                    : 'border-border/60 bg-card/40 opacity-70'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {isUnlocked && (
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-30 blur-2xl" />
                )}
                <div className="relative">
                  <div
                    className={`mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl text-3xl ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30'
                        : 'bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    {isUnlocked ? a.emoji : <Lock className="h-6 w-6" />}
                  </div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                  {isUnlocked && (
                    <Pill className="mt-3 border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-3 w-3" />
                      Открыто
                    </Pill>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageSection>
  )
}
