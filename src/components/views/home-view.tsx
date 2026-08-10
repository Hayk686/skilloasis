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
  Network,
  Command,
  Star,
  Quote,
} from 'lucide-react'
import { useNav, useUI, ViewId } from '@/lib/store'
import { SUBJECTS, localizeSubject } from '@/lib/subjects'
import { PageSection, GradientButton, StaggerGroup, StaggerItem, GlassCard, Pill } from '@/components/ui-blocks'
import { Particles } from '@/components/aurora'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

const QUICK_ACTIONS: { id: ViewId; title: LocalizedText; desc: LocalizedText; icon: typeof Sparkles; gradient: string }[] = [
  { id: 'tutor', title: localized('Спросить наставника', 'Ask the tutor', 'Հարցնել ուսուցչին'), desc: localized('AI ответит на любой вопрос', 'AI will answer any question', 'AI-ը կպատասխանի ցանկացած հարցի'), icon: MessagesSquare, gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'lessons', title: localized('Изучить тему', 'Explore a topic', 'Ուսումնասիրել թեման'), desc: localized('Интерактивный урок за 10 минут', 'An interactive lesson in 10 minutes', 'Ինտերակտիվ դաս՝ 10 րոպեում'), icon: BookOpen, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'quiz', title: localized('Проверить себя', 'Test yourself', 'Ստուգել գիտելիքները'), desc: localized('Адаптивный квиз по любой теме', 'An adaptive quiz on any topic', 'Հարմարեցվող հարցաշար ցանկացած թեմայով'), icon: Trophy, gradient: 'from-amber-500 to-orange-500' },
  { id: 'flashcards', title: localized('Запомнить надолго', 'Remember for longer', 'Երկար հիշել'), desc: localized('Флешкарты с интервалами', 'Spaced-repetition flashcards', 'Պարբերական կրկնությամբ քարտեր'), icon: Layers, gradient: 'from-sky-500 to-cyan-500' },
]

const FEATURES = [
  { icon: Brain, title: localized('Понимает, а не зубрит', 'Understand, do not memorize', 'Հասկանալ, ոչ թե անգիր անել'), desc: localized('Объясняет через аналогии и примеры. Сложное становится простым.', 'Learn through analogies and examples. Complex ideas become simple.', 'Բացատրություններ՝ համեմատություններով և օրինակներով։ Բարդը դառնում է պարզ։') },
  { icon: InfinityIcon, title: localized('Безлимит и бесплатно', 'Unlimited and free', 'Անսահման և անվճար'), desc: localized('Никаких подписок, лимитов и платных функций. Навсегда.', 'No subscriptions, limits, or paid features. Ever.', 'Առանց բաժանորդագրության, սահմանափակումների և վճարովի գործառույթների։ Ընդմիշտ։') },
  { icon: Rocket, title: localized('Адаптируется под тебя', 'Adapts to you', 'Հարմարվում է քեզ'), desc: localized('Подбирает сложность и темп. Растёшь вместе с платформой.', 'Matches your difficulty and pace as you grow.', 'Ընտրում է քեզ համապատասխան բարդությունն ու տեմպը։') },
  { icon: Heart, title: localized('Воодушевляет', 'Keeps you inspired', 'Ոգեշնչում է'), desc: localized('Тёплый наставник, который верит в твой прогресс.', 'A supportive tutor that believes in your progress.', 'Հոգատար ուսուցիչ, որը հավատում է քո առաջընթացին։') },
]

const TESTIMONIALS = [
  { name: localized('Анна', 'Anna', 'Աննա'), role: localized('Студентка, 19', 'Student, 19', 'Ուսանող, 19'), gradient: 'from-violet-500 to-fuchsia-500', text: localized('Наконец-то платформа, где объясняют по-человечески. Аналогии просто огонь — квантовая физика стала понятна за вечер.', 'Finally, a platform that explains things clearly. The analogies made quantum physics understandable in one evening.', 'Վերջապես հարթակ, որտեղ ամեն ինչ պարզ են բացատրում։ Համեմատությունների շնորհիվ քվանտային ֆիզիկան հասկանալի դարձավ մեկ երեկոյում։') },
  { name: localized('Михаил', 'Michael', 'Միքայել'), role: localized('Программист, 28', 'Developer, 28', 'Ծրագրավորող, 28'), gradient: 'from-emerald-500 to-teal-500', text: localized('Флешкарты с интервальным повторением — то, чего мне не хватало. SM-2 работает, запоминаю в разы быстрее.', 'Spaced-repetition flashcards were exactly what I needed. SM-2 helps me remember much faster.', 'Պարբերական կրկնությամբ քարտերը հենց այն էին, ինչ ինձ պակասում էր։ SM-2-ն օգնում է շատ ավելի արագ հիշել։') },
  { name: localized('Елена', 'Elena', 'Ելենա'), role: localized('Учитель, 42', 'Teacher, 42', 'Ուսուցիչ, 42'), gradient: 'from-amber-500 to-orange-500', text: localized('Делаю квизы для учеников за секунды. Бесплатно и качественно — даже не верится, что такое бывает.', 'I create student quizzes in seconds. It is hard to believe something this good is free.', 'Վայրկյանների ընթացքում հարցաշարեր եմ ստեղծում աշակերտներիս համար։ Դժվար է հավատալ, որ այսքան որակյալ գործիքն անվճար է։') },
  { name: localized('Дмитрий', 'Dmitry', 'Դմիտրի'), role: localized('Школьник, 16', 'Student, 16', 'Աշակերտ, 16'), gradient: 'from-sky-500 to-cyan-500', text: localized('AI-наставник отвечает лучше любого репетитора. И не ругается, когда я задаю глупые вопросы :)', 'The AI tutor answers better than any tutor and never minds my silly questions :)', 'AI ուսուցիչը պատասխանում է ցանկացած կրկնուսույցից լավ և չի բարկանում իմ պարզ հարցերից :)') },
  { name: localized('София', 'Sofia', 'Սոֆիա'), role: localized('Дизайнер, 25', 'Designer, 25', 'Դիզայներ, 25'), gradient: 'from-rose-500 to-pink-500', text: localized('Аудио-озвучка уроков спасает в дороге. Слушаю историю искусств в метро — и учусь.', 'Audio lessons are perfect on the go. I learn art history while riding the metro.', 'Դասերի աուդիո տարբերակը շատ հարմար է ճանապարհին։ Մետրոյում լսում եմ արվեստի պատմություն և սովորում։') },
  { name: localized('Артём', 'Artem', 'Արտյոմ'), role: localized('Студент, 21', 'Student, 21', 'Ուսանող, 21'), gradient: 'from-fuchsia-500 to-purple-500', text: localized('Маршруты обучения — бомба. Написал «стать ML-инженером», получил чёткий план из 8 шагов.', 'Learning paths are fantastic. I entered “become an ML engineer” and got a clear eight-step plan.', 'Ուսուցման ուղիները հրաշալի են։ Գրեցի «դառնալ ML ինժեներ» և ստացա հստակ ութ քայլանոց ծրագիր։') },
  { name: localized('Вика', 'Vika', 'Վիկա'), role: localized('Маркетолог, 30', 'Marketer, 30', 'Մարքեթոլոգ, 30'), gradient: 'from-purple-500 to-fuchsia-500', text: localized('Дашборд с XP и серией дней затягивает. Уже неделю не пропускаю — жалко ломать стрик.', 'The XP dashboard and daily streak keep me engaged. I have not missed a day all week.', 'XP վահանակն ու օրերի շարքը մոտիվացնում են։ Արդեն մեկ շաբաթ ոչ մի օր բաց չեմ թողել։') },
]

export function HomeView() {
  const { setView, openSubject } = useNav()
  const { setCommandOpen } = useUI()
  const { locale, tr, localize } = useTranslations()

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
                {tr('100% бесплатно · без регистрации · без лимитов', '100% free · no sign-up · no limits', '100% անվճար · առանց գրանցման · առանց սահմանափակումների')}
              </Pill>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
            >
              {tr('Учись', 'Learn', 'Սովորիր')} <span className="text-gradient">{tr('чему угодно', 'anything', 'ամեն ինչ')}</span>
              <br />
              {tr('с умным наставником', 'with a smart tutor', 'խելացի ուսուցչի հետ')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl"
            >
              {tr(
                'SkillOasis — это AI-платформа, которая объясняет сложное простыми словами. Программирование, математика, языки, наука, история — всё в одном месте.',
                'SkillOasis is an AI learning platform that explains complex ideas in simple words. Programming, mathematics, languages, science, and history—all in one place.',
                'SkillOasis-ը AI ուսուցման հարթակ է, որը բարդ թեմաները բացատրում է պարզ բառերով։ Ծրագրավորում, մաթեմատիկա, լեզուներ, գիտություն և պատմություն՝ ամեն ինչ մեկ տեղում։'
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <GradientButton onClick={() => setView('tutor')} className="px-7 py-3 text-base">
                {tr('Начать учиться', 'Start learning', 'Սկսել սովորել')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GradientButton>
              <button
                onClick={() => setView('subjects')}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-6 py-3 text-base font-semibold backdrop-blur-sm transition-colors hover:bg-accent"
              >
                <Compass className="h-4 w-4" />
                {tr('Выбрать предмет', 'Choose a subject', 'Ընտրել առարկա')}
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
                { v: '8+', l: tr('предметов', 'subjects', 'առարկա') },
                { v: '∞', l: tr('тем для изучения', 'topics to explore', 'ուսումնասիրվող թեմա') },
                { v: '0$', l: tr('стоимость', 'cost', 'արժեք') },
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
                  <p className="font-semibold">{localize(a.title)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{localize(a.desc)}</p>
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
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr('Миры знаний', 'Worlds of knowledge', 'Գիտելիքի աշխարհներ')}</h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {tr('Выбери область — и начни погружение', 'Choose an area and start exploring', 'Ընտրիր ոլորտը և սկսիր ուսումնասիրել')}
            </p>
          </div>
          <button
            onClick={() => setView('subjects')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {tr('Все предметы', 'All subjects', 'Բոլոր առարկաները')} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((s) => {
            const subject = localizeSubject(s, locale)
            return <StaggerItem key={s.id}>
              <button
                onClick={() => openSubject(s.id)}
                className="group relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${s.gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
                <div className="relative">
                  <div className={`mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${s.gradient} text-2xl shadow-lg`}>
                    {s.emoji}
                  </div>
                  <p className="font-semibold">{subject.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subject.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {subject.topics.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            </StaggerItem>
          })}
        </StaggerGroup>
      </PageSection>

      {/* Why SkillOasis */}
      <PageSection className="py-12">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr('Почему SkillOasis', 'Why SkillOasis', 'Ինչու SkillOasis')}</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {tr('Учиться должно быть радостно', 'Learning should feel joyful', 'Սովորելը պետք է հաճելի լինի')}
          </p>
        </div>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <StaggerItem key={localize(f.title)}>
                <GlassCard className="h-full p-5">
                  <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold">{localize(f.title)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{localize(f.desc)}</p>
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
            <Sparkles className="h-3 w-3" /> {tr('Новинки', 'New', 'Նորույթներ')}
          </Pill>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr('Свежие возможности', 'Latest features', 'Նոր հնարավորություններ')}</h2>
        </div>
        <StaggerGroup className="grid gap-4 md:grid-cols-3">
          <StaggerItem>
            <GlassCard className="group h-full cursor-pointer p-5" >
              <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
                <Volume2 className="h-5 w-5" />
              </div>
              <p className="font-semibold">{tr('Аудио-озвучка уроков', 'Audio lessons', 'Դասերի աուդիո տարբերակ')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr('Не хочешь читать? Включи бесплатную озвучку прямо в браузере.', 'Do not feel like reading? Use free narration directly in your browser.', 'Չե՞ս ուզում կարդալ։ Միացրու անվճար ձայնավորումը հենց դիտարկիչում։')}
              </p>
              <button
                onClick={() => setView('lessons')}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {tr('Попробовать', 'Try it', 'Փորձել')} <ArrowRight className="h-3 w-3" />
              </button>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard className="group h-full cursor-pointer p-5">
              <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
                <Network className="h-5 w-5" />
              </div>
              <p className="font-semibold">{tr('Карты знаний', 'Knowledge maps', 'Գիտելիքի քարտեզներ')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr('AI превращает любую тему в наглядную карту понятий и связей.', 'AI turns any topic into a visual map of concepts and connections.', 'AI-ը ցանկացած թեմա վերածում է հասկացությունների և կապերի տեսողական քարտեզի։')}
              </p>
              <button
                onClick={() => setView('mindmap')}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {tr('Построить карту', 'Build a map', 'Կառուցել քարտեզ')} <ArrowRight className="h-3 w-3" />
              </button>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard className="group h-full cursor-pointer p-5">
              <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <Command className="h-5 w-5" />
              </div>
              <p className="font-semibold flex items-center gap-2">
                {tr('Командная палитра', 'Command palette', 'Հրամանների վահանակ')}
                <kbd className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr('Мгновенный доступ ко всему: разделы, предметы и AI-объяснение любой концепции в одном окне.', 'Instant access to sections, subjects, and AI explanations in one place.', 'Բաժինները, առարկաները և AI բացատրությունները հասանելի են մեկ պատուհանից։')}
              </p>
              <button
                onClick={() => setCommandOpen(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {tr('Открыть', 'Open', 'Բացել')} <ArrowRight className="h-3 w-3" />
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
            {tr('Ученики по всему миру уже полюбили SkillOasis', 'Learners around the world already love SkillOasis', 'Ամբողջ աշխարհի սովորողներն արդեն սիրում են SkillOasis-ը')}
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
                <p className="text-sm leading-relaxed text-foreground/90">«{localize(t.text)}»</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white`}>
                    {localize(t.name).charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{localize(t.name)}</p>
                    <p className="text-[11px] text-muted-foreground">{localize(t.role)}</p>
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
              {tr('Готов начать путь?', 'Ready to begin?', 'Պատրա՞ստ ես սկսել')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {tr('Один вопрос — и ты уже учишься. Без обязательств, без оплаты, без границ.', 'One question is all it takes to start learning. No commitments, fees, or boundaries.', 'Մեկ հարց, և դու արդեն սովորում ես։ Առանց պարտավորությունների, վճարների և սահմանների։')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <GradientButton onClick={() => setView('tutor')} className="px-7 py-3 text-base">
                {tr('Спросить наставника', 'Ask the tutor', 'Հարցնել ուսուցչին')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GradientButton>
              <button
                onClick={() => setView('paths')}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-6 py-3 text-base font-semibold backdrop-blur-sm transition-colors hover:bg-accent"
              >
                <Compass className="h-4 w-4" />
                {tr('Построить маршрут', 'Build a learning path', 'Կառուցել ուսուցման ուղի')}
              </button>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
