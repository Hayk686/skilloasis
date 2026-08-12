'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Send,
  Plus,
  MessagesSquare,
  Trash2,
  Sparkles,
  Loader2,
  PanelLeft,
  BookOpen,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { useNav, useUser } from '@/lib/store'
import { SUBJECTS, getSubject, localizeSubject } from '@/lib/subjects'
import {
  PageSection,
  SectionHeader,
  GlassCard,
  LoadingState,
  Pill,
} from '@/components/ui-blocks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

// ---------- types ----------
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatSessionMeta {
  id: string
  subject: string
  title: string
  updatedAt: string
  _count: { messages: number }
}

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

// ---------- suggestions ----------
const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

const SUGGESTED_PROMPTS: { emoji: string; text: LocalizedText; subject: string }[] = [
  { emoji: '⚛️', text: localized('Объясни квантовую запутанность', 'Explain quantum entanglement', 'Բացատրիր քվանտային խճճվածությունը'), subject: 'science' },
  { emoji: '🧩', text: localized('Как работают замыкания в JS?', 'How do closures work in JavaScript?', 'Ինչպե՞ս են աշխատում փակումները JavaScript-ում'), subject: 'programming' },
  { emoji: '🧠', text: localized('Расскажи про стоицизм', 'Tell me about Stoicism', 'Պատմիր ստոիցիզմի մասին'), subject: 'philosophy' },
  { emoji: '📈', text: localized('Что такое производная?', 'What is a derivative?', 'Ի՞նչ է ածանցյալը'), subject: 'math' },
  { emoji: '🎨', text: localized('В чём суть импрессионизма?', 'What is the essence of Impressionism?', 'Ո՞րն է իմպրեսիոնիզմի էությունը'), subject: 'art' },
  { emoji: '🏛️', text: localized('Почему пал Рим?', 'Why did Rome fall?', 'Ինչո՞ւ անկում ապրեց Հռոմը'), subject: 'history' },
]

const SESSION_KEY = 'info-oasis:tutor-session'
const LEGACY_SESSION_KEYS = ['skilloasis:tutor-session', 'lumina:tutor-session'] as const

function clearStoredSession() {
  sessionStorage.removeItem(SESSION_KEY)
  LEGACY_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key))
}

// ---------- main view ----------
export function TutorView() {
  const { activeSubject } = useNav()
  const { locale, tr } = useTranslations()

  const [subject, setSubject] = useState<string>(activeSubject ?? 'general')
  const [sessions, setSessions] = useState<ChatSessionMeta[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [listOpen, setListOpen] = useState(false) // mobile sheet

  const messagesAreaRef = useRef<HTMLDivElement>(null)

  // Keep chat scrolling inside its own viewport instead of moving the whole page.
  useEffect(() => {
    if (messages.length === 0 && !sending) return
    const viewport = messagesAreaRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  // ---------- data fns ----------
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions as ChatSessionMeta[])
      }
    } catch {
      // silent — sidebar just shows empty
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const loadThread = useCallback(async (sid: string) => {
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/chat/${sid}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || tr('Не удалось загрузить диалог', 'Could not load the conversation', 'Չհաջողվեց բեռնել զրույցը'))
      const apiMsgs = (data.session?.messages ?? []) as ApiMessage[]
      const msgs: ChatMessage[] = apiMsgs.map((m, i) => ({
        id: `${sid}-${i}`,
        role: m.role,
        content: m.content,
      }))
      setMessages(msgs)
      if (data.session?.subject && data.session.subject !== 'general') {
        setSubject(data.session.subject)
      }
      setSessionId(sid)
      sessionStorage.setItem(SESSION_KEY, sid)
    } catch (e) {
      const msg = e instanceof Error ? e.message : tr('Не удалось загрузить диалог', 'Could not load the conversation', 'Չհաջողվեց բեռնել զրույցը')
      toast.error(msg)
      setSessionId(null)
      clearStoredSession()
    } finally {
      setLoadingThread(false)
      setListOpen(false)
    }
  }, [tr])

  // On mount and locale changes: load the session list and restore the current thread.
  useEffect(() => {
    const stored =
      sessionStorage.getItem(SESSION_KEY) ??
      LEGACY_SESSION_KEYS.map((key) => sessionStorage.getItem(key)).find(Boolean)
    if (stored) {
      sessionStorage.setItem(SESSION_KEY, stored)
      LEGACY_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key))
      void loadThread(stored)
    }
    void loadSessions()
  }, [loadSessions, loadThread])

  async function deleteSession(sid: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    try {
      const res = await fetch(`/api/chat/${sid}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(tr('Не удалось удалить', 'Could not delete', 'Չհաջողվեց ջնջել'))
      setSessions((s) => s.filter((x) => x.id !== sid))
      if (sessionId === sid) {
        setSessionId(null)
        setMessages([])
        clearStoredSession()
      }
      toast.success(tr('Диалог удалён', 'Conversation deleted', 'Զրույցը ջնջված է'))
    } catch {
      toast.error(tr('Не удалось удалить диалог', 'Could not delete the conversation', 'Չհաջողվեց ջնջել զրույցը'))
    }
  }

  function startNewChat() {
    setSessionId(null)
    setMessages([])
    setInput('')
    clearStoredSession()
    setListOpen(false)
  }

  // ---------- send ----------
  async function send(text?: string, overrideSubject?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setInput('')

    const usedSubject = overrideSubject ?? subject

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    }
    const prevMessages = messages
    const nextMessages = [...prevMessages, userMsg]
    setMessages(nextMessages)
    setSending(true)

    try {
      const history = prevMessages.map(
        (m): ApiMessage => ({ role: m.role, content: m.content })
      )
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          subject: usedSubject,
          sessionId,
          history,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || tr('Не удалось получить ответ', 'Could not get a response', 'Չհաջողվեց պատասխան ստանալ'))

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply as string,
      }
      setMessages((m) => [...m, aiMsg])

      const newSid: string | undefined = data.sessionId
      if (newSid) {
        setSessionId(newSid)
        sessionStorage.setItem(SESSION_KEY, newSid)
      }
      if (typeof data.xp === 'number' && typeof data.level === 'number') {
        useUser.setState({ xp: data.xp, level: data.level })
      }
      void loadSessions()
    } catch (e) {
      const msg = e instanceof Error ? e.message : tr('Не удалось получить ответ', 'Could not get a response', 'Չհաջողվեց պատասխան ստանալ')
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  // ---------- derived ----------
  const activeSubjectObj =
    subject && subject !== 'general' ? getSubject(subject) : null

  return (
    <PageSection className="relative py-6 sm:py-8">
      {/* ambient cosmic glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-72 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at center, oklch(0.7 0.25 315 / 0.18), transparent 70%)',
        }}
      />

      <SectionHeader
        title={tr('AI-наставник', 'AI tutor', 'AI ուսուցիչ')}
        subtitle={tr('Спроси что угодно — объясню, разберу по шагам, подскажу дальше', 'Ask anything—I will explain it step by step and help you move forward', 'Հարցրու ցանկացած բան․ կբացատրեմ քայլ առ քայլ և կօգնեմ առաջ շարժվել')}
        icon={Sparkles}
        action={
          <div className="hidden items-center gap-2 sm:flex">
            {activeSubjectObj && (
              <Pill className="border-primary/30 bg-primary/10 text-primary">
                <span>{activeSubjectObj.emoji}</span>
                {localizeSubject(activeSubjectObj, locale).name}
              </Pill>
            )}
          </div>
        }
      />

      {/* mobile: open sessions sheet + new chat */}
      <div className="mb-3 flex flex-wrap items-center gap-2 lg:hidden">
        <Sheet open={listOpen} onOpenChange={setListOpen}>
          <SheetTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-card">
              <PanelLeft className="h-4 w-4" />
              {tr('Диалоги', 'Conversations', 'Զրույցներ')}
              {sessions.length > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 text-xs text-primary">
                  {sessions.length}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <MessagesSquare className="h-4 w-4 text-primary" />
                {tr('Диалоги', 'Conversations', 'Զրույցներ')}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <SidebarContent
                sessions={sessions}
                loading={loadingSessions}
                currentId={sessionId}
                onSelect={(id) => void loadThread(id)}
                onDelete={(id, ev) => void deleteSession(id, ev)}
                onNew={startNewChat}
              />
            </div>
          </SheetContent>
        </Sheet>

        <NewChatButton onClick={startNewChat} small />
      </div>

      {/* main grid */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* left rail — desktop */}
        <GlassCard
          hover={false}
          className="hidden flex-col overflow-hidden p-3 lg:flex lg:h-[calc(100dvh-13rem)] lg:min-h-[500px] lg:max-h-[820px]"
        >
          <SidebarContent
            sessions={sessions}
            loading={loadingSessions}
            currentId={sessionId}
            onSelect={(id) => void loadThread(id)}
            onDelete={(id, ev) => void deleteSession(id, ev)}
            onNew={startNewChat}
          />
        </GlassCard>

        {/* right — chat thread + composer */}
        <GlassCard
          hover={false}
          gradient
          className="flex h-[calc(100dvh-15rem)] min-h-[420px] max-h-[760px] flex-col overflow-hidden sm:h-[72vh] sm:min-h-[520px] lg:h-[calc(100dvh-13rem)] lg:min-h-[500px] lg:max-h-[820px]"
        >
          {/* chat header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 px-3 py-3 sm:gap-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30">
                <Sparkles className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">
                  {sessionId ? tr('Активный диалог', 'Active conversation', 'Ակտիվ զրույց') : tr('Новый диалог', 'New conversation', 'Նոր զրույց')}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {sending ? tr('Наставник печатает…', 'Tutor is typing…', 'Ուսուցիչը գրում է…') : tr('Готов помочь', 'Ready to help', 'Պատրաստ եմ օգնել')}
                </p>
              </div>
            </div>

            <SubjectPicker value={subject} onChange={setSubject} />
          </div>

          {/* messages area */}
          <div ref={messagesAreaRef} className="relative flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 px-4 py-4 sm:px-6">
                {loadingThread ? (
                  <LoadingState label={tr('Загружаю диалог…', 'Loading conversation…', 'Բեռնում ենք զրույցը…')} />
                ) : messages.length === 0 ? (
                  <EmptyChat
                    onPick={(p, s) => {
                      if (s) setSubject(s)
                      void send(p, s)
                    }}
                  />
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <MessageBubble key={m.id} message={m} />
                    ))}
                  </AnimatePresence>
                )}

                {sending && <TypingBubble />}

                <div className="h-1" />
              </div>
            </ScrollArea>
          </div>

          {/* composer */}
          <Composer
            value={input}
            onChange={setInput}
            onKeyDown={onKeyDown}
            onSend={() => void send()}
            disabled={sending}
          />
        </GlassCard>
      </div>
    </PageSection>
  )
}

// ---------- sidebar content ----------
function SidebarContent({
  sessions,
  loading,
  currentId,
  onSelect,
  onDelete,
  onNew,
}: {
  sessions: ChatSessionMeta[]
  loading: boolean
  currentId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string, e?: React.MouseEvent) => void
  onNew: () => void
}) {
  const { dateLocale, tr } = useTranslations()
  return (
    <div className="flex h-full flex-col gap-3">
      <NewChatButton onClick={onNew} />

      <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <MessagesSquare className="h-3.5 w-3.5" />
        {tr('Недавние', 'Recent', 'Վերջինները')}
      </div>

      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            {tr('Пока нет диалогов', 'No conversations yet', 'Դեռ զրույցներ չկան')}
            <br />
            {tr('Задай первый вопрос 👇', 'Ask your first question 👇', 'Տուր առաջին հարցը 👇')}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {sessions.map((s) => {
              const subj = getSubject(s.subject)
              const active = s.id === currentId
              return (
                <li key={s.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(s.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelect(s.id)
                      }
                    }}
                    className={cn(
                      'ambient-card group relative flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                      active
                        ? 'border-primary/40 bg-primary/10 glow-soft'
                        : 'border-border/50 bg-background/40 hover:border-border hover:bg-card'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-xs',
                        subj ? subj.gradient : 'from-violet-500 to-fuchsia-500'
                      )}
                    >
                      <span className="text-white">{subj?.emoji ?? '💬'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {s.title || tr('Без названия', 'Untitled', 'Անվերնագիր')}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {s._count?.messages ?? 0} {tr('сообщ.', 'messages', 'հաղորդագրություն')} · {formatDate(s.updatedAt, dateLocale, tr)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => onDelete(s.id, e)}
                      className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                      aria-label={tr('Удалить диалог', 'Delete conversation', 'Ջնջել զրույցը')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function NewChatButton({
  onClick,
  small,
}: {
  onClick: () => void
  small?: boolean
}) {
  const { tr } = useTranslations()
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:shadow-xl hover:shadow-fuchsia-500/40',
        small ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm'
      )}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {tr('Новый диалог', 'New conversation', 'Նոր զրույց')}
      </span>
    </button>
  )
}

// ---------- subject picker ----------
function SubjectPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const { locale, tr } = useTranslations()
  return (
    <div className="flex items-center gap-2">
      <BookOpen className="hidden h-4 w-4 text-muted-foreground sm:block" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="h-11 w-[118px] border-border/60 bg-background/60 text-xs sm:w-[180px] sm:text-sm lg:h-9"
          size="sm"
        >
          <SelectValue placeholder={tr('Предмет', 'Subject', 'Առարկա')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general">
            <span className="flex items-center gap-2">
              <span>✨</span> {tr('Общий', 'General', 'Ընդհանուր')}
            </span>
          </SelectItem>
          {SUBJECTS.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex items-center gap-2">
                <span>{s.emoji}</span>
                {localizeSubject(s, locale).name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ---------- message bubble ----------
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const { tr } = useTranslations()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* avatar */}
      {isUser ? (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/60 bg-card/60 text-muted-foreground">
          <span className="text-xs font-bold">{tr('Я', 'Me', 'Ես')}</span>
        </div>
      ) : (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-md shadow-fuchsia-500/30">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[75%]',
          isUser
            ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-fuchsia-500/20'
            : 'glass-strong border border-border/60 text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose-ai">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ---------- typing indicator ----------
function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-md shadow-fuchsia-500/30">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="glass-strong flex items-center gap-1.5 rounded-2xl border border-border/60 px-4 py-3.5 text-primary">
        <div className="dot-typing flex items-center gap-1">
          <span />
          <span />
          <span />
        </div>
      </div>
    </motion.div>
  )
}

// ---------- empty state ----------
function EmptyChat({
  onPick,
}: {
  onPick: (prompt: string, subject?: string) => void
}) {
  const { tr, localize } = useTranslations()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center px-3 py-6 text-center sm:px-4 sm:py-14"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-xl shadow-fuchsia-500/30 sm:mb-5 sm:h-20 sm:w-20 sm:rounded-3xl"
      >
        <Sparkles className="h-7 w-7 sm:h-9 sm:w-9" />
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-50 blur-xl" />
      </motion.div>

      <h3 className="text-xl font-bold sm:text-2xl">
        {tr('Привет! Я твой', 'Hi! I am your', 'Ողջույն։ Ես քո')} <span className="text-gradient">{tr('AI-наставник', 'AI tutor', 'AI ուսուցիչն եմ')}</span>
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {tr('Спроси что угодно — от квантовой физики до основ философии. Выбери идею ниже или напиши свой вопрос.', 'Ask anything—from quantum physics to philosophy. Choose an idea below or write your own question.', 'Հարցրու ցանկացած բան՝ քվանտային ֆիզիկայից մինչև փիլիսոփայություն։ Ընտրիր ներքևի գաղափարներից մեկը կամ գրիր քո հարցը։')}
      </p>

      <div className="mt-5 grid w-full max-w-2xl gap-2 sm:mt-6 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((p) => {
          const text = localize(p.text)
          return (
          <motion.button
            key={text}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPick(text, p.subject)}
            className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted/60 text-lg">
              {p.emoji}
            </span>
            <span className="text-sm font-medium">{text}</span>
            <Zap className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary" />
          </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ---------- composer ----------
function Composer({
  value,
  onChange,
  onKeyDown,
  onSend,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  disabled: boolean
}) {
  const { tr } = useTranslations()
  return (
    <div className="border-t border-border/60 bg-card/40 p-3 backdrop-blur sm:p-4">
      <div className="relative flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={tr('Напиши вопрос наставнику… (Enter — отправить, Shift+Enter — перенос)', 'Ask the tutor… (Enter to send, Shift+Enter for a new line)', 'Գրիր հարց ուսուցչին… (Enter՝ ուղարկելու, Shift+Enter՝ նոր տողի համար)')}
            rows={1}
            className="max-h-40 min-h-[48px] resize-none rounded-2xl border-border/60 bg-background/60 px-4 py-3 text-sm leading-relaxed ring-primary/20 focus-visible:ring-2"
          />
        </div>

        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'group relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25 transition-all',
            'hover:scale-105 hover:shadow-xl hover:shadow-fuchsia-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
          )}
          aria-label={tr('Отправить сообщение', 'Send message', 'Ուղարկել հաղորդագրությունը')}
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">
            {disabled ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </span>
        </button>
      </div>
      <p className="mt-1.5 hidden px-1 text-xs text-muted-foreground sm:block">
        {tr('Накапливай XP за каждый вопрос — развивайся вместе с Info Oasis', 'Earn XP for every question and grow with Info Oasis', 'Յուրաքանչյուր հարցի համար հավաքիր XP և զարգացիր Info Oasis-ի հետ')}
      </p>
    </div>
  )
}

// ---------- utils ----------
function formatDate(
  iso: string,
  dateLocale: string,
  tr: (ru: string, en: string, hy: string) => string
): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return tr('только что', 'just now', 'հենց նոր')
    if (diffMin < 60) return tr(`${diffMin} мин назад`, `${diffMin} min ago`, `${diffMin} րոպե առաջ`)
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return tr(`${diffH} ч назад`, `${diffH} hr ago`, `${diffH} ժամ առաջ`)
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return tr(`${diffD} д назад`, `${diffD} days ago`, `${diffD} օր առաջ`)
    return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}
