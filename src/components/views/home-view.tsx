'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  Atom,
  CirclePlay,
  Code2,
  Languages,
  Landmark,
} from 'lucide-react'
import { useNav, useUI, ViewId } from '@/lib/store'
import { PageSection, GradientButton, StaggerGroup, StaggerItem, GlassCard, Pill } from '@/components/ui-blocks'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

const QUICK_ACTIONS: { id: ViewId; title: LocalizedText; desc: LocalizedText; icon: typeof Sparkles; gradient: string }[] = [
  { id: 'tutor', title: localized('Спросить наставника', 'Ask the tutor', 'Հարցնել ուսուցչին'), desc: localized('AI ответит на любой вопрос', 'AI will answer any question', 'AI-ը կպատասխանի ցանկացած հարցի'), icon: MessagesSquare, gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'lessons', title: localized('Изучить тему', 'Explore a topic', 'Ուսումնասիրել թեման'), desc: localized('Интерактивный урок за 10 минут', 'An interactive lesson in 10 minutes', 'Ինտերակտիվ դաս՝ 10 րոպեում'), icon: BookOpen, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'quiz', title: localized('Проверить себя', 'Test yourself', 'Ստուգել գիտելիքները'), desc: localized('Адаптивный квиз по любой теме', 'An adaptive quiz on any topic', 'Հարմարեցվող հարցաշար ցանկացած թեմայով'), icon: Trophy, gradient: 'from-amber-500 to-orange-500' },
  { id: 'flashcards', title: localized('Запомнить надолго', 'Remember for longer', 'Երկար հիշել'), desc: localized('Флешкарты с интервалами', 'Spaced-repetition flashcards', 'Պարբերական կրկնությամբ քարտեր'), icon: Layers, gradient: 'from-sky-500 to-cyan-500' },
]

const HERO_WORLDS: {
  id: string
  subjectId: string
  label: LocalizedText
  headline: LocalizedText
  description: LocalizedText
  lesson: LocalizedText
  icon: typeof Sparkles
  position: string
  ambient: string
}[] = [
  {
    id: 'programming',
    subjectId: 'programming',
    label: localized('Программирование', 'Programming', 'Ծրագրավորում'),
    headline: localized('СОЗДАВАЙ\nБУДУЩЕЕ', 'BUILD\nTHE FUTURE', 'ԿԵՐՏԻՐ\nԱՊԱԳԱՆ'),
    description: localized('От первой строки кода до работающих приложений — с AI-наставником рядом.', 'From your first line of code to working applications—with an AI tutor beside you.', 'Կոդի առաջին տողից մինչև աշխատող հավելվածներ՝ AI ուսուցչի աջակցությամբ։'),
    lesson: localized('Python с нуля', 'Python from scratch', 'Python՝ զրոյից'),
    icon: Code2,
    position: '10% center',
    ambient: 'from-violet-600/30 via-blue-500/10 to-transparent',
  },
  {
    id: 'science',
    subjectId: 'science',
    label: localized('Наука', 'Science', 'Գիտություն'),
    headline: localized('ИССЛЕДУЙ\nВСЁ', 'QUESTION\nEVERYTHING', 'ԲԱՑԱՀԱՅՏԻՐ\nԱՄԵՆ ԻՆՉ'),
    description: localized('Исследуй физику, химию и космос через ясные объяснения и наглядные примеры.', 'Explore physics, chemistry, and space through clear explanations and visual examples.', 'Ուսումնասիրիր ֆիզիկան, քիմիան և տիեզերքը՝ պարզ բացատրություններով ու տեսողական օրինակներով։'),
    lesson: localized('Как устроена Вселенная', 'How the universe works', 'Ինչպես է կառուցված տիեզերքը'),
    icon: Atom,
    position: '43% center',
    ambient: 'from-cyan-500/30 via-blue-500/10 to-transparent',
  },
  {
    id: 'languages',
    subjectId: 'languages',
    label: localized('Языки', 'Languages', 'Լեզուներ'),
    headline: localized('ГОВОРИ\nС МИРОМ', 'SPEAK TO\nTHE WORLD', 'ԽՈՍԻՐ\nԱՇԽԱՐՀԻ ՀԵՏ'),
    description: localized('Осваивай новые языки через живую практику, понятную грамматику и полезные слова.', 'Learn new languages through real practice, clear grammar, and useful vocabulary.', 'Սովորիր նոր լեզուներ՝ կենդանի փորձով, պարզ քերականությամբ և օգտակար բառապաշարով։'),
    lesson: localized('Разговорный английский', 'Conversational English', 'Խոսակցական անգլերեն'),
    icon: Languages,
    position: '69% center',
    ambient: 'from-fuchsia-500/25 via-amber-500/10 to-transparent',
  },
  {
    id: 'history',
    subjectId: 'history',
    label: localized('История', 'History', 'Պատմություն'),
    headline: localized('УЧИСЬ У\nВРЕМЕНИ', 'LEARN FROM\nTIME', 'ՍՈՎՈՐԻՐ\nԺԱՄԱՆԱԿԻՑ'),
    description: localized('Понимай настоящее через цивилизации, открытия и идеи, которые изменили мир.', 'Understand today through the civilizations, discoveries, and ideas that changed the world.', 'Հասկացիր ներկան՝ աշխարհը փոխած քաղաքակրթությունների, հայտնագործությունների և գաղափարների միջոցով։'),
    lesson: localized('Древние цивилизации', 'Ancient civilizations', 'Հին քաղաքակրթություններ'),
    icon: Landmark,
    position: '94% center',
    ambient: 'from-orange-500/30 via-rose-500/10 to-transparent',
  },
]

const FEATURES = [
  { icon: Brain, gradient: 'from-fuchsia-100/90 via-violet-50 to-white dark:from-fuchsia-950/95 dark:via-violet-950/85 dark:to-slate-950', iconColor: 'text-fuchsia-700 dark:text-fuchsia-200', title: localized('Понимает, а не зубрит', 'Understand, do not memorize', 'Հասկանալ, ոչ թե անգիր անել'), desc: localized('Объясняет через аналогии и примеры. Сложное становится простым.', 'Learn through analogies and examples. Complex ideas become simple.', 'Բացատրություններ՝ համեմատություններով և օրինակներով։ Բարդը դառնում է պարզ։') },
  { icon: InfinityIcon, gradient: 'from-cyan-100/90 via-teal-50 to-white dark:from-cyan-950/90 dark:via-teal-950/80 dark:to-slate-950', iconColor: 'text-cyan-700 dark:text-cyan-200', title: localized('Безлимит и бесплатно', 'Unlimited and free', 'Անսահման և անվճար'), desc: localized('Никаких подписок, лимитов и платных функций. Навсегда.', 'No subscriptions, limits, or paid features. Ever.', 'Առանց բաժանորդագրության, սահմանափակումների և վճարովի գործառույթների։ Ընդմիշտ։') },
  { icon: Rocket, gradient: 'from-emerald-100/90 via-green-50 to-white dark:from-emerald-950/90 dark:via-green-950/80 dark:to-slate-950', iconColor: 'text-emerald-700 dark:text-emerald-200', title: localized('Адаптируется под тебя', 'Adapts to you', 'Հարմարվում է քեզ'), desc: localized('Подбирает сложность и темп. Растёшь вместе с платформой.', 'Matches your difficulty and pace as you grow.', 'Ընտրում է քեզ համապատասխան բարդությունն ու տեմպը։') },
  { icon: Heart, gradient: 'from-rose-100/90 via-red-50 to-white dark:from-rose-950/90 dark:via-red-950/75 dark:to-slate-950', iconColor: 'text-rose-700 dark:text-rose-200', title: localized('Воодушевляет', 'Keeps you inspired', 'Ոգեշնչում է'), desc: localized('Тёплый наставник, который верит в твой прогресс.', 'A supportive tutor that believes in your progress.', 'Հոգատար ուսուցիչ, որը հավատում է քո առաջընթացին։') },
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
  const [heroWorld, setHeroWorld] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const activeWorld = HERO_WORLDS[heroWorld]
  const ActiveWorldIcon = activeWorld.icon

  useEffect(() => {
    if (heroPaused) return
    const interval = window.setInterval(() => {
      setHeroWorld((current) => (current + 1) % HERO_WORLDS.length)
    }, 7000)
    return () => window.clearInterval(interval)
  }, [heroPaused])

  function finishHeroSwipe(clientX: number) {
    if (touchStartX.current === null) return
    const distance = clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(distance) < 44) return
    setHeroWorld((current) => (
      distance < 0
        ? (current + 1) % HERO_WORLDS.length
        : (current - 1 + HERO_WORLDS.length) % HERO_WORLDS.length
    ))
  }

  return (
    <div>
      {/* Hero */}
      <section
        aria-label={tr('Обучение в Info Oasis', 'Learning with Info Oasis', 'Ուսուցում Info Oasis-ում')}
        className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onFocusCapture={() => setHeroPaused(true)}
        onBlurCapture={() => setHeroPaused(false)}
        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null }}
        onTouchEnd={(event) => finishHeroSwipe(event.changedTouches[0]?.clientX ?? 0)}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={`hero-image-${activeWorld.id}`}
            aria-hidden
            initial={{ opacity: 0, scale: 1.065 }}
            animate={{ opacity: 1, scale: 1.015 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.15, ease: 'easeOut' }}
            className="absolute inset-0 bg-cover bg-center opacity-45 brightness-[1.35] saturate-[0.72] dark:opacity-100 dark:brightness-[0.7] dark:saturate-[1.08]"
            style={{
              backgroundImage: "url('/info-oasis-knowledge-world.webp')",
              backgroundPosition: activeWorld.position,
            }}
          />
        </AnimatePresence>
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-r ${activeWorld.ambient} transition-colors duration-700`} />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,250,252,.96)_0%,rgba(248,250,252,.82)_44%,rgba(248,250,252,.34)_76%,rgba(248,250,252,.52)_100%)] dark:bg-[linear-gradient(90deg,rgba(2,6,23,.92)_0%,rgba(2,6,23,.72)_42%,rgba(2,6,23,.23)_73%,rgba(2,6,23,.44)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,.28),transparent_38%,rgba(248,250,252,.9))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,.18),transparent_38%,rgba(2,6,23,.86))]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1400px] flex-col px-5 pb-5 pt-10 sm:px-8 sm:pb-7 sm:pt-14 lg:px-12 lg:pb-8 xl:px-10 xl:pr-20 2xl:px-16 2xl:pr-24">
          <div className="grid flex-1 items-center gap-10 py-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.65fr)] xl:gap-8 xl:py-12 2xl:gap-16">
            <motion.div
              key={`${locale}-${activeWorld.id}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-800 sm:text-xs sm:tracking-[0.26em] dark:text-cyan-200/90">
                <span className="h-px w-10 shrink-0 bg-cyan-700/70 dark:bg-cyan-300/70" />
                <span className="min-w-0 [overflow-wrap:anywhere]">Info Oasis · {localize(activeWorld.label)}</span>
              </div>
              <h1 className="text-[clamp(2.9rem,7vw,6.4rem)] font-black leading-[0.88] tracking-[-0.06em] text-slate-950 drop-shadow-[0_4px_30px_rgba(255,255,255,.5)] dark:text-white dark:drop-shadow-[0_4px_30px_rgba(0,0,0,.35)]">
                {localize(activeWorld.headline).split('\n').map((line, index) => (
                  <span key={line} className="block overflow-hidden pb-[0.05em]">
                    <motion.span
                      className="block"
                      initial={{ y: '105%' }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {line}
                    </motion.span>
                  </span>
                ))}
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-700 [overflow-wrap:anywhere] sm:mt-8 sm:text-lg sm:leading-8 dark:text-white/76">
                {localize(activeWorld.description)}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setView('tutor')}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 font-semibold text-white shadow-[0_16px_40px_-16px_rgba(217,70,239,.8)] transition-transform hover:-translate-y-0.5"
                >
                  {tr('Начать учиться', 'Start learning', 'Սկսել սովորել')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('how-info-oasis-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-900/20 bg-white/55 px-6 font-semibold text-slate-950 backdrop-blur-md transition-colors hover:border-slate-900/35 hover:bg-white/75 dark:border-white/30 dark:bg-black/20 dark:text-white dark:hover:border-white/55 dark:hover:bg-white/10"
                >
                  <CirclePlay className="h-5 w-5" />
                  {tr('Как это работает', 'See how it works', 'Ինչպես է աշխատում')}
                </button>
              </div>
            </motion.div>

            <motion.aside
              key={`feature-${locale}-${activeWorld.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="self-end rounded-2xl border border-slate-900/12 bg-white/72 p-5 text-slate-950 shadow-2xl shadow-slate-900/15 backdrop-blur-xl sm:p-6 lg:self-center dark:border-white/18 dark:bg-slate-950/48 dark:text-white dark:shadow-black/30"
            >
              <div className="mb-8 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/55">
                <span>{tr('Тема дня', 'Featured lesson', 'Օրվա թեմա')}</span>
                <span>{String(heroWorld + 1).padStart(2, '0')} / {String(HERO_WORLDS.length).padStart(2, '0')}</span>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-slate-900/10 bg-white/65 text-cyan-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-cyan-200 dark:shadow-none">
                <ActiveWorldIcon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight">{localize(activeWorld.lesson)}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere] dark:text-white/65">{localize(activeWorld.description)}</p>
              <button
                type="button"
                onClick={() => openSubject(activeWorld.subjectId)}
                className="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cyan-700 transition-colors hover:text-slate-950 dark:text-cyan-200 dark:hover:text-white"
              >
                {tr('Открыть предмет', 'Explore this subject', 'Բացել առարկան')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.aside>
          </div>

          <div className="mb-5 grid grid-cols-4 gap-2 xl:hidden" aria-label={tr('Выбрать мир', 'Choose a world', 'Ընտրել աշխարհը')}>
            {HERO_WORLDS.map((world, index) => {
              const WorldIcon = world.icon
              return (
                <button
                  key={world.id}
                  type="button"
                  onClick={() => setHeroWorld(index)}
                  aria-label={localize(world.label)}
                  aria-pressed={index === heroWorld}
                  className={`grid h-12 place-items-center rounded-xl border backdrop-blur-md transition-colors ${index === heroWorld ? 'border-cyan-700/45 bg-cyan-100/75 text-cyan-800 dark:border-cyan-300/65 dark:bg-cyan-300/15 dark:text-cyan-100' : 'border-slate-900/15 bg-white/45 text-slate-600 dark:border-white/15 dark:bg-black/20 dark:text-white/60'}`}
                >
                  <WorldIcon className="h-5 w-5" />
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-3 border-t border-slate-900/12 py-5 sm:py-6 dark:border-white/18">
            {[
              { v: '8+', l: tr('предметов', 'subjects', 'առարկա') },
              { v: '∞', l: tr('тем для изучения', 'topics to explore', 'ուսումնասիրվող թեմա') },
              { v: '0$', l: tr('стоимость', 'cost', 'արժեք') },
            ].map((stat, index) => (
              <div key={stat.l} className={`px-3 text-center sm:px-6 ${index > 0 ? 'border-l border-slate-900/12 dark:border-white/18' : ''}`}>
                <div className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">{stat.v}</div>
                <div className="mt-1 text-[11px] text-slate-600 sm:text-sm dark:text-white/55">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex xl:right-7" aria-label={tr('Выбрать мир', 'Choose a world', 'Ընտրել աշխարհը')}>
          {HERO_WORLDS.map((world, index) => (
            <button
              key={world.id}
              type="button"
              onClick={() => setHeroWorld(index)}
              aria-label={localize(world.label)}
              aria-pressed={index === heroWorld}
              className={`flex min-h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold backdrop-blur-md transition-all ${index === heroWorld ? 'border-cyan-700/50 bg-cyan-100/80 text-cyan-900 shadow-lg shadow-cyan-500/15 dark:border-cyan-300/70 dark:bg-cyan-300/16 dark:text-white dark:shadow-cyan-500/20' : 'border-slate-900/15 bg-white/55 text-slate-600 hover:border-slate-900/35 hover:text-slate-950 dark:border-white/15 dark:bg-black/20 dark:text-white/50 dark:hover:border-white/40 dark:hover:text-white'}`}
            >
              {String(index + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section id="how-info-oasis-works" className="scroll-mt-20">
        <PageSection className="py-8 sm:py-12">
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <StaggerItem key={a.id}>
                <button
                  onClick={() => setView(a.id)}
                  className="ambient-card group relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-primary/10"
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
      </section>

      {/* Why Info Oasis */}
      <PageSection className="render-lazy py-12">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/55 px-5 py-10 shadow-2xl shadow-primary/5 dark:border-white/10 dark:bg-[#07070a] dark:shadow-black/30 sm:px-8 sm:py-14 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.1),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(0,0,0,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.5)_1px,transparent_1px)] [background-size:38px_38px] dark:opacity-[0.035] dark:[background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)]" />

          <div className="relative mx-auto mb-9 max-w-2xl text-center sm:mb-11">
            <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Info Oasis
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white sm:text-4xl">{tr('Почему Info Oasis', 'Why Info Oasis', 'Ինչու Info Oasis')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground dark:text-white/55 sm:text-base">
              {tr('Учиться должно быть радостно', 'Learning should feel joyful', 'Սովորելը պետք է հաճելի լինի')}
            </p>
          </div>

          <StaggerGroup className="relative mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <StaggerItem key={localize(f.title)}>
                  <article className={`ambient-card group relative h-full min-h-48 overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br ${f.gradient} p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-2xl dark:border-white/10 dark:hover:border-white/20 sm:p-7`}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-60" />
                    <div className="relative">
                      <div className={`mb-7 inline-grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 ${f.iconColor} shadow-inner shadow-white/5 backdrop-blur-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight text-foreground dark:text-white sm:text-xl">{localize(f.title)}</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground dark:text-white/70">{localize(f.desc)}</p>
                    </div>
                  </article>
                </StaggerItem>
              )
            })}
          </StaggerGroup>
        </div>
      </PageSection>

      {/* What's new — highlight recently shipped features */}
      <PageSection className="render-lazy py-12">
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
      <section className="render-lazy relative overflow-hidden border-y border-border/40 bg-card/30 py-10">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {tr('Ученики по всему миру уже полюбили Info Oasis', 'Learners around the world already love Info Oasis', 'Ամբողջ աշխարհի սովորողներն արդեն սիրում են Info Oasis-ը')}
          </p>
        </div>
        <div className="relative flex overflow-hidden mask-fade-b">
          <div className="flex shrink-0 animate-ticker gap-4 pr-4">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div
                key={i}
                className="ambient-card w-[min(20rem,calc(100vw-3rem))] shrink-0 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm"
              >
                <Quote className="mb-2 h-5 w-5 text-primary/40" />
                <p className="text-sm leading-relaxed text-foreground/90">«{localize(t.text)}»</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white`}>
                    {localize(t.name).charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{localize(t.name)}</p>
                    <p className="text-xs text-muted-foreground">{localize(t.role)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <PageSection className="render-lazy py-16">
        <div className="ambient-card relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 p-8 text-center sm:p-12">
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
              <GradientButton onClick={() => setView('tutor')} className="w-full px-7 py-3 text-base sm:w-auto">
                {tr('Спросить наставника', 'Ask the tutor', 'Հարցնել ուսուցչին')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GradientButton>
              <button
                onClick={() => setView('paths')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-6 py-3 text-base font-semibold backdrop-blur-sm transition-colors hover:bg-accent sm:w-auto"
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
