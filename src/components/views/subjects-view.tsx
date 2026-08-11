'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, BookOpen, Trophy, Layers, MessagesSquare, ChevronRight } from 'lucide-react'
import { SUBJECTS, Subject, localizeSubject, localizeSubjectLevel } from '@/lib/subjects'
import { useNav } from '@/lib/store'
import { PageSection, SectionHeader, Pill, StaggerGroup, StaggerItem } from '@/components/ui-blocks'
import { useTranslations } from '@/lib/i18n-client'

export function SubjectsView() {
  const { activeSubject, setSubject, setView } = useNav()
  const { locale, tr } = useTranslations()
  const [selected, setSelected] = useState<Subject | null>(
    activeSubject ? SUBJECTS.find((s) => s.id === activeSubject) ?? null : null
  )

  return (
    <PageSection className="py-8">
      <SectionHeader
        title={tr('Предметы', 'Subjects', 'Առարկաներ')}
        subtitle={tr('Выбери область знаний и начни погружение', 'Choose a field and start exploring', 'Ընտրիր գիտելիքի ոլորտը և սկսիր ուսումնասիրել')}
        icon={Sparkles}
      />

      <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SUBJECTS.map((s) => {
          const subject = localizeSubject(s, locale)
          return <StaggerItem key={s.id}>
            <button
              onClick={() => {
                setSelected(s)
                setSubject(s.id)
              }}
              className="ambient-card group relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${s.gradient} opacity-25 blur-2xl transition-opacity group-hover:opacity-50`} />
              <div className="relative">
                <div className={`mb-4 inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.gradient} text-3xl shadow-lg`}>
                  {s.emoji}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{subject.name}</p>
                  <Pill className="text-[10px]">{localizeSubjectLevel(s.level, locale)}</Pill>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{subject.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {subject.topics.map((t) => (
                    <span key={t} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {tr('Открыть', 'Open', 'Բացել')} <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          </StaggerItem>
        })}
      </StaggerGroup>

      {/* Subject detail drawer */}
      <AnimatePresence>
        {selected && (
          <SubjectDetail
            subject={selected}
            onClose={() => {
              setSelected(null)
              setSubject(null)
            }}
            onAction={(action) => {
              setSubject(selected.id)
              setView(action)
            }}
          />
        )}
      </AnimatePresence>
    </PageSection>
  )
}

function SubjectDetail({
  subject,
  onClose,
  onAction,
}: {
  subject: Subject
  onClose: () => void
  onAction: (v: 'tutor' | 'lessons' | 'quiz' | 'flashcards') => void
}) {
  const { locale, tr } = useTranslations()
  const localizedSubject = localizeSubject(subject, locale)
  const actions = [
    { id: 'tutor' as const, label: tr('Спросить наставника', 'Ask the tutor', 'Հարցնել ուսուցչին'), desc: tr('Чат по теме', 'Topic chat', 'Զրույց թեմայի շուրջ'), icon: MessagesSquare },
    { id: 'lessons' as const, label: tr('Изучить тему', 'Explore the topic', 'Ուսումնասիրել թեման'), desc: tr('Интерактивный урок', 'Interactive lesson', 'Ինտերակտիվ դաս'), icon: BookOpen },
    { id: 'quiz' as const, label: tr('Квиз', 'Quiz', 'Հարցաշար'), desc: tr('Проверить знания', 'Test your knowledge', 'Ստուգել գիտելիքները'), icon: Trophy },
    { id: 'flashcards' as const, label: tr('Флешкарты', 'Flashcards', 'Քարտեր'), desc: tr('Запомнить термины', 'Remember key terms', 'Հիշել եզրույթները'), icon: Layers },
  ]
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <div className={`relative h-28 bg-gradient-to-br ${subject.gradient}`}>
          <div className="absolute inset-0 bg-grid opacity-20" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-black/20 text-white backdrop-blur-sm hover:bg-black/30"
          >
            ✕
          </button>
          <div className="absolute -bottom-7 left-6 grid h-16 w-16 place-items-center rounded-2xl bg-card text-4xl shadow-xl">
            {subject.emoji}
          </div>
        </div>
        <div className="px-6 pb-6 pt-10">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{localizedSubject.name}</h3>
            <Pill>{localizeSubjectLevel(subject.level, locale)}</Pill>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{localizedSubject.description}</p>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tr('Популярные темы', 'Popular topics', 'Հանրաճանաչ թեմաներ')}
            </p>
            <div className="flex flex-wrap gap-2">
              {localizedSubject.topics.map((t) => (
                <span key={t} className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {actions.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.id}
                  onClick={() => onAction(a.id)}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3 text-left transition-all hover:border-primary/40 hover:bg-accent"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </>
  )
}
