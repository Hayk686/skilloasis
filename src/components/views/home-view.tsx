'use client'

import { motion } from 'framer-motion'
import {
  Sparkles,
  MessagesSquare,
  BookOpen,
  Trophy,
  Layers,
  Compass,
  ArrowRight,
  Zap,
  Infinity as InfinityIcon,
  Heart,
  Brain,
  Rocket,
  Volume2,
  ImageIcon,
  Command,
  Star,
  Quote,
} from 'lucide-react'
import { useNav, useUI, ViewId } from '@/lib/store'
import { SUBJECTS } from '@/lib/subjects'
import { PageSection, GradientButton, StaggerGroup, StaggerItem, GlassCard, Pill } from '@/components/ui-blocks'
import { Particles } from '@/components/aurora'

const QUICK_ACTIONS: { id: ViewId; title: string; desc: string; icon: typeof Sparkles; gradient: string }[] = [
  { id: 'tutor', title: 'Спросить наставника', desc: 'AI ответит на любой вопрос', icon: MessagesSquare, gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'lessons', title: 'Изучить тему', desc: 'Интерактивный урок за 10 минут', icon: BookOpen, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'quiz', title: 'Проверить себя', desc: 'Адаптивный квиз по любой теме', icon: Trophy, gradient: 'from-amber-500 to-orange-500' },
  { id: 'flashcards', title: 'Запомнить надолго', desc: 'Флешкарты с интервалами', icon: Layers, gradient: 'from-sky-500 to-cyan-500' },
]

const FEATURES = [
  { icon: Brain, title: 'Понимает, а не зубрит', desc: 'Объясняет через аналогии и примеры. Сложное становится простым.' },
  { icon: InfinityIcon, title: 'Безлимит и бесплатно', desc: 'Никаких подписок, лимитов и платных функций. Навсегда.' },
  { icon: Rocket, title: 'Адаптируется под тебя', desc: 'Подбирает сложность и темп. Растёшь вместе с платформой.' },
  { icon: Heart, title: 'Воодушевляет', desc: 'Тёплый наставник, который верит в твой прогресс.' },
]

const TESTIMONIALS = [
  { name: 'Анна', role: 'Студентка, 19', gradient: 'from-violet-500 to-fuchsia-500', text: 'Наконец-то платформа, где объясняют по-человечески. Аналогии просто огонь — квантовая физика стала понятна за вечер.' },
  { name: 'Михаил', role: 'Программист, 28', gradient: 'from-emerald-500 to-teal-500', text: 'Флешкарты с интервальным повторением — то, чего мне не хватало. SM-2 работает, запоминаю в разы быстрее.' },
  { name: 'Елена', role: 'Учитель, 42', gradient: 'from-amber-500 to-orange-500', text: 'Делаю квизы для учеников за секунды. Бесплатно и качественно — даже не верится, что такое бывает.' },
  { name: 'Дмитрий', role: 'Школьник, 16', gradient: 'from-sky-500 to-cyan-500', text: 'AI-наставник отвечает лучше любого репетитора. И не ругается, когда я задаю глупые вопросы :)' },
  { name: 'София', role: 'Дизайнер, 25', gradient: 'from-rose-500 to-pink-500', text: 'Аудио-озвучка уроков спасает в дороге. Слушаю историю искусств в метро — и учусь.' },
  { name: 'Артём', role: 'Студент, 21', gradient: 'from-fuchsia-500 to-purple-500', text: 'Маршруты обучения — бомба. Написал «стать ML-инженером», получил чёткий план из 8 шагов.' },
  { name: 'Вика', role: 'Маркетолог, 30', gradient: 'from-purple-500 to-fuchsia-500', text: 'Дашборд с XP и серией дней затягивает. Уже неделю не пропускаю — жалко ломать стрик.' },
]

export function HomeView() {
  const { setView, openSubject } = useNav()
  const { setCommandOpen } = useUI()

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Particles count={24} />
        <PageSection className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Pill className="mx-auto mb-6 border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" />
                100% бесплатно · без регистрации · без лимитов
              </Pill>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
            >
              Учись <span className="text-gradient">чему угодно</span>
              <br />
              с умным наставником
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl"
            >
              Lumina — это AI-платформа, которая объясняет сложное простыми словами.
              Программирование, математика, языки, наука, история — всё в одном месте.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <GradientButton onClick={() => setView('tutor')} className="px-7 py-3 text-base">
                Начать учиться
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GradientButton>
              <button
                onClick={() => setView('subjects')}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-6 py-3 text-base font-semibold backdrop-blur-sm transition-colors hover:bg-accent"
              >
                <Compass className="h-4 w-4" />
                Выбрать предмет
              </button>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4"
            >
              {[
                { v: '8+', l: 'предметов' },
                { v: '∞', l: 'тем для изучения' },
                { v: '0₽', l: 'стоимость' },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-border/40 bg-card/40 px-4 py-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-gradient sm:text-3xl">{s.v}</div>
                  <div className="text-xs text-muted-foreground sm:text-sm">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </PageSection>
      </section>

      {/* Quick actions */}
      <PageSection className="py-12">
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <StaggerItem key={a.id}>
                <button
                  onClick={() => setView(a.id)}
                  className="group relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-primary/10"
                >
                  <div className={`mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${a.gradient} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                  <ArrowRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </button>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </PageSection>

      {/* Subjects grid */}
      <PageSection className="py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Миры знаний</h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Выбери область — и начни погружение
            </p>
          </div>
          <button
            onClick={() => setView('subjects')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Все предметы <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((s) => (
            <StaggerItem key={s.id}>
              <button
                onClick={() => openSubject(s.id)}
                className="group relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${s.gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
                <div className="relative">
                  <div className={`mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${s.gradient} text-2xl shadow-lg`}>
                    {s.emoji}
                  </div>
                  <p className="font-semibold">{s.ru}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.topics.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </PageSection>

      {/* Why Lumina */}
      <PageSection className="py-12">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Почему Lumina</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Учиться должно быть радостно
          </p>
        </div>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <StaggerItem key={f.title}>
                <GlassCard className="h-full p-5">
                  <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </GlassCard>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </PageSection>

      {/* What's new — highlight recently shipped features */}
      <PageSection className="py-12">
        <div className="mb-6 flex items-center gap-2">
          <Pill className="border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" /> Новинки
          </Pill>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Свежие возможности</h2>
        </div>
        <StaggerGroup className="grid gap-4 md:grid-cols-3">
          <StaggerItem>
            <GlassCard className="group h-full cursor-pointer p-5" >
              <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
                <Volume2 className="h-5 w-5" />
              </div>
              <p className="font-semibold">Аудио-озвучка уроков</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Не хочешь читать? Включи озвучку — AI прочитает урок вслух естественным голосом.
              </p>
              <button
                onClick={() => setView('lessons')}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Попробовать <ArrowRight className="h-3 w-3" />
              </button>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard className="group h-full cursor-pointer p-5">
              <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="font-semibold">AI-иллюстрации</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Каждому уроку — уникальная иллюстрация, сгенерированная под тему. Визуально и запоминается.
              </p>
              <button
                onClick={() => setView('lessons')}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Сгенерировать <ArrowRight className="h-3 w-3" />
              </button>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard className="group h-full cursor-pointer p-5">
              <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <Command className="h-5 w-5" />
              </div>
              <p className="font-semibold flex items-center gap-2">
                Командная палитра
                <kbd className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Мгновенный доступ ко всему: разделы, предметы и AI-объяснение любой концепции в одном окне.
              </p>
              <button
                onClick={() => setCommandOpen(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Открыть <ArrowRight className="h-3 w-3" />
              </button>
            </GlassCard>
          </StaggerItem>
        </StaggerGroup>
      </PageSection>

      {/* Testimonials marquee */}
      <section className="relative overflow-hidden border-y border-border/40 bg-card/30 py-10">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Ученики по всему миру уже полюбили Lumina
          </p>
        </div>
        <div className="relative flex overflow-hidden mask-fade-b">
          <div className="flex shrink-0 animate-ticker gap-4 pr-4">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div
                key={i}
                className="w-80 shrink-0 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm"
              >
                <Quote className="mb-2 h-5 w-5 text-primary/40" />
                <p className="text-sm leading-relaxed text-foreground/90">«{t.text}»</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <PageSection className="py-16">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 p-8 text-center sm:p-12">
          <div className="absolute inset-0 bg-grid opacity-20 mask-radial" />
          <div className="relative">
            <Zap className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Готов начать путь?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Один вопрос — и ты уже учишься. Без обязательств, без оплаты, без границ.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <GradientButton onClick={() => setView('tutor')} className="px-7 py-3 text-base">
                Спросить наставника
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GradientButton>
              <button
                onClick={() => setView('paths')}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-6 py-3 text-base font-semibold backdrop-blur-sm transition-colors hover:bg-accent"
              >
                <Compass className="h-4 w-4" />
                Построить маршрут
              </button>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
