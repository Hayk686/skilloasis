'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Terminal,
  Play,
  Trash2,
  Sparkles,
  Loader2,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Copy,
  Code2,
  Zap,
} from 'lucide-react'
import { PageSection, SectionHeader, GlassCard } from '@/components/ui-blocks'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

interface LogEntry {
  type: 'log' | 'warn' | 'error' | 'info'
  args: string[]
}

interface Challenge {
  id: string
  title: LocalizedText
  desc: LocalizedText
  code: LocalizedText
  hint: LocalizedText
}

const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

type PlaygroundLanguage = 'javascript' | 'typescript'

const JAVASCRIPT_STARTER = localized(`// Добро пожаловать в песочницу SkillOasis 🚀
// Пиши JavaScript и нажми «Запустить» (Ctrl+Enter)

function greet(name) {
  return \`Привет, \${name}! Добро пожаловать в SkillOasis.\`
}

console.log(greet('друг'))

// Попробуй массивы:
const nums = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Сумма:', sum)
console.log('Среднее:', sum / nums.length)
`, `// Welcome to the SkillOasis playground 🚀
// Write JavaScript and press Run (Ctrl+Enter)

function greet(name) {
  return \`Hello, \${name}! Welcome to SkillOasis.\`
}

console.log(greet('friend'))

// Try working with arrays:
const nums = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Sum:', sum)
console.log('Average:', sum / nums.length)
`, `// Բարի գալուստ SkillOasis-ի կոդի փորձադաշտ 🚀
// Գրիր JavaScript և սեղմիր «Գործարկել» (Ctrl+Enter)

function greet(name) {
  return \`Ողջույն, \${name}։ Բարի գալուստ SkillOasis։\`
}

console.log(greet('ընկեր'))

// Փորձիր աշխատել զանգվածների հետ․
const nums = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Գումար՝', sum)
console.log('Միջին՝', sum / nums.length)
`)

const TYPESCRIPT_STARTER = localized(`// Добро пожаловать в песочницу TypeScript SkillOasis 🚀
// Пиши TypeScript и нажми «Запустить» (Ctrl+Enter)

function greet(name: string): string {
  return \`Привет, \${name}! Добро пожаловать в SkillOasis.\`
}

console.log(greet('друг'))

// Попробуй типизированные массивы:
const nums: number[] = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Сумма:', sum)
console.log('Среднее:', sum / nums.length)
`, `// Welcome to the SkillOasis TypeScript playground 🚀
// Write TypeScript and press Run (Ctrl+Enter)

function greet(name: string): string {
  return \`Hello, \${name}! Welcome to SkillOasis.\`
}

console.log(greet('friend'))

// Try typed arrays:
const nums: number[] = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Sum:', sum)
console.log('Average:', sum / nums.length)
`, `// Բարի գալուստ SkillOasis-ի TypeScript փորձադաշտ 🚀
// Գրիր TypeScript և սեղմիր «Գործարկել» (Ctrl+Enter)

function greet(name: string): string {
  return \`Ողջույն, \${name}։ Բարի գալուստ SkillOasis։\`
}

console.log(greet('ընկեր'))

// Փորձիր տիպավորված զանգվածներ․
const nums: number[] = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Գումար՝', sum)
console.log('Միջին՝', sum / nums.length)
`)

const STARTERS: Record<PlaygroundLanguage, LocalizedText> = {
  javascript: JAVASCRIPT_STARTER,
  typescript: TYPESCRIPT_STARTER,
}

const CHALLENGES: Challenge[] = [
  {
    id: 'fizzbuzz',
    title: localized('FizzBuzz', 'FizzBuzz', 'FizzBuzz'),
    desc: localized('Выведи числа 1-20, заменяя кратные 3 на Fizz, 5 на Buzz, 15 на FizzBuzz', 'Print 1–20, replacing multiples of 3 with Fizz, 5 with Buzz, and 15 with FizzBuzz', 'Տպիր 1–20 թվերը՝ 3-ի բազմապատիկները փոխարինելով Fizz-ով, 5-ինը՝ Buzz-ով, իսկ 15-ինը՝ FizzBuzz-ով'),
    code: localized(`// FizzBuzz: числа от 1 до 20
for (let i = 1; i <= 20; i++) {
  let out = ''
  if (i % 3 === 0) out += 'Fizz'
  if (i % 5 === 0) out += 'Buzz'
  console.log(out || i)
}`, `// FizzBuzz: numbers from 1 to 20
for (let i = 1; i <= 20; i++) {
  let out = ''
  if (i % 3 === 0) out += 'Fizz'
  if (i % 5 === 0) out += 'Buzz'
  console.log(out || i)
}`, `// FizzBuzz․ 1-ից 20 թվերը
for (let i = 1; i <= 20; i++) {
  let out = ''
  if (i % 3 === 0) out += 'Fizz'
  if (i % 5 === 0) out += 'Buzz'
  console.log(out || i)
}`),
    hint: localized('Используй оператор % (остаток от деления) и конкатенацию строк.', 'Use the % remainder operator and string concatenation.', 'Օգտագործիր % մնացորդի օպերատորը և տողերի միացումը։'),
  },
  {
    id: 'fib',
    title: localized('Числа Фибоначчи', 'Fibonacci numbers', 'Ֆիբոնաչիի թվեր'),
    desc: localized('Выведи первые 10 чисел последовательности Фибоначчи', 'Print the first ten Fibonacci numbers', 'Տպիր Ֆիբոնաչիի հաջորդականության առաջին տասը թվերը'),
    code: localized(`// Первые 10 чисел Фибоначчи
let a = 0, b = 1
const fib = [a, b]
for (let i = 2; i < 10; i++) {
  const next = a + b
  fib.push(next)
  a = b
  b = next
}
console.log('Фибоначчи:', fib.join(', '))`, `// First ten Fibonacci numbers
let a = 0, b = 1
const fib = [a, b]
for (let i = 2; i < 10; i++) {
  const next = a + b
  fib.push(next)
  a = b
  b = next
}
console.log('Fibonacci:', fib.join(', '))`, `// Ֆիբոնաչիի առաջին տասը թվերը
let a = 0, b = 1
const fib = [a, b]
for (let i = 2; i < 10; i++) {
  const next = a + b
  fib.push(next)
  a = b
  b = next
}
console.log('Ֆիբոնաչի՝', fib.join(', '))`),
    hint: localized('Каждое следующее число = сумма двух предыдущих.', 'Each number is the sum of the previous two.', 'Յուրաքանչյուր հաջորդ թիվը նախորդ երկուսի գումարն է։'),
  },
  {
    id: 'palindrome',
    title: localized('Палиндром', 'Palindrome', 'Պալինդրոմ'),
    desc: localized('Проверь, является ли строка палиндромом', 'Check whether a string is a palindrome', 'Ստուգիր՝ արդյոք տողը պալինդրոմ է'),
    code: localized(`// Проверка палиндрома
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  return clean === clean.split('').reverse().join('')
}

console.log(isPalindrome('А роза упала на лапу Азора')) // ?
console.log(isPalindrome('привет')) // ?`, `// Palindrome check
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  return clean === clean.split('').reverse().join('')
}

console.log(isPalindrome('Never odd or even')) // ?
console.log(isPalindrome('hello')) // ?`, `// Պալինդրոմի ստուգում
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  return clean === clean.split('').reverse().join('')
}

console.log(isPalindrome('Աննա')) // ?
console.log(isPalindrome('ողջույն')) // ?`),
    hint: localized('Очисти строку от пробелов и регистра, затем сравни с перевёрнутой.', 'Remove spaces and letter casing, then compare with the reversed string.', 'Հեռացրու բացատներն ու տառաչափի տարբերությունը, ապա համեմատիր շրջված տողի հետ։'),
  },
  {
    id: 'sort',
    title: localized('Сортировка объектов', 'Sorting objects', 'Օբյեկտների տեսակավորում'),
    desc: localized('Отсортируй пользователей по возрасту (по убыванию)', 'Sort users by age in descending order', 'Տեսակավորիր օգտատերերին ըստ տարիքի՝ նվազման կարգով'),
    code: localized(`// Сортировка массива объектов
const users = [
  { name: 'Аня', age: 28 },
  { name: 'Боря', age: 19 },
  { name: 'Вика', age: 35 },
  { name: 'Гена', age: 22 },
]

const sorted = [...users].sort((a, b) => b.age - a.age)
console.log('По возрасту (убыв.):')
sorted.forEach((u, i) => console.log(\`\${i + 1}. \${u.name}, \${u.age} лет\`))
// ↑ попробуй попросить AI-подсказку для разбора!`, `// Sorting an array of objects
const users = [
  { name: 'Anna', age: 28 },
  { name: 'Ben', age: 19 },
  { name: 'Victoria', age: 35 },
  { name: 'George', age: 22 },
]

const sorted = [...users].sort((a, b) => b.age - a.age)
console.log('By age (descending):')
sorted.forEach((u, i) => console.log(\`\${i + 1}. \${u.name}, age \${u.age}\`))
// ↑ Ask for an AI hint to understand how this works!`, `// Օբյեկտների զանգվածի տեսակավորում
const users = [
  { name: 'Անի', age: 28 },
  { name: 'Բեն', age: 19 },
  { name: 'Վիկա', age: 35 },
  { name: 'Գևորգ', age: 22 },
]

const sorted = [...users].sort((a, b) => b.age - a.age)
console.log('Ըստ տարիքի՝ նվազման կարգով․')
sorted.forEach((u, i) => console.log(\`\${i + 1}. \${u.name}, \${u.age} տարեկան\`))
// ↑ Խնդրիր AI հուշում՝ հասկանալու համար, թե ինչպես է սա աշխատում։`),
    hint: localized('Передай компаратор в sort(): (a, b) => b.age - a.age для убывания. Сделай копию через [...users], чтобы не менять оригинал.', 'Pass (a, b) => b.age - a.age to sort(). Copy with [...users] so the original is unchanged.', 'sort()-ին փոխանցիր (a, b) => b.age - a.age համեմատիչը։ [...users]-ով պատճեն ստեղծիր, որպեսզի բնօրինակը չփոխվի։'),
  },
]

/** Build the sandboxed iframe srcdoc that runs code safely. */
function buildSandboxDoc(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<script>
  // Capture console methods
  const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  function send(type, args) {
    try {
      parent.postMessage({ __skilloasis_sandbox: true, kind: 'log', log: { type, args: args.map(String) } }, '*');
    } catch (e) {}
  }
  console.log = (...a) => { send('log', a); orig.log(...a); };
  console.warn = (...a) => { send('warn', a); orig.warn(...a); };
  console.error = (...a) => { send('error', a); orig.error(...a); };
  console.info = (...a) => { send('info', a); orig.info(...a); };
  window.addEventListener('error', (e) => {
    parent.postMessage({ __skilloasis_sandbox: true, kind: 'error', message: e.message }, '*');
  });
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.__skilloasis_run) return;
    const code = e.data.code;
    let result = null;
    try {
      // Indirect eval → runs in global scope, captures return of expression
      result = eval(code);
      parent.postMessage({ __skilloasis_sandbox: true, kind: 'done', result: result === undefined ? null : String(result) }, '*');
    } catch (err) {
      parent.postMessage({ __skilloasis_sandbox: true, kind: 'error', message: (err && err.message) ? err.message : String(err) }, '*');
    }
  });
  parent.postMessage({ __skilloasis_sandbox: true, kind: 'ready' }, '*');
<\/script>
</body></html>`
}

export function PlaygroundView() {
  const { locale, tr, localize } = useTranslations()
  const [language, setLanguage] = useState<PlaygroundLanguage>('javascript')
  const [code, setCode] = useState(() => localize(STARTERS.javascript))
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [tab, setTab] = useState<'console' | 'hint'>('console')
  const [hint, setHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const readyRef = useRef(false)
  const previousLocaleRef = useRef(locale)

  // Keep untouched starter/exercise text aligned with the selected site language.
  useEffect(() => {
    const previousLocale = previousLocaleRef.current
    if (previousLocale === locale) return

    setCode((current) => {
      const challenge = CHALLENGES.find((item) => item.id === activeChallenge)
      const previousTemplate = challenge
        ? challenge.code[previousLocale]
        : STARTERS[language][previousLocale]
      const nextTemplate = challenge ? challenge.code[locale] : STARTERS[language][locale]
      return current === previousTemplate ? nextTemplate : current
    })
    setLogs([])
    setError(null)
    setResult(null)
    setHint(null)
    previousLocaleRef.current = locale
  }, [activeChallenge, language, locale])

  // Create sandbox iframe once
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.srcdoc = buildSandboxDoc()
  }, [])

  // Listen for sandbox messages
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data
      if (!d || !d.__skilloasis_sandbox) return
      if (d.kind === 'ready') {
        readyRef.current = true
      } else if (d.kind === 'log') {
        setLogs((prev) => [...prev, d.log])
      } else if (d.kind === 'error') {
        setError(d.message)
        setRunning(false)
      } else if (d.kind === 'done') {
        setResult(d.result)
        setRunning(false)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const run = useCallback(async () => {
    setLogs([])
    setError(null)
    setResult(null)
    setTab('console')
    setRunning(true)
    let executableCode = code
    if (language === 'typescript') {
      try {
        const response = await fetch('/api/playground/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'TypeScript compilation failed')
        executableCode = data.code
      } catch (compileError) {
        setError(compileError instanceof Error ? compileError.message : String(compileError))
        setRunning(false)
        return
      }
    }
    // small delay in case iframe not ready
    const send = () => {
      if (!readyRef.current) {
        setTimeout(send, 80)
        return
      }
      iframeRef.current?.contentWindow?.postMessage({ __skilloasis_run: true, code: executableCode }, '*')
    }
    send()
    // safety timeout
    setTimeout(() => setRunning((r) => r), 5000)
  }, [code, language])

  const clearOutput = useCallback(() => {
    setLogs([])
    setError(null)
    setResult(null)
  }, [])

  const resetCode = useCallback(() => {
    setCode(localize(STARTERS[language]))
    setActiveChallenge(null)
    clearOutput()
    toast(tr('Код сброшен', 'Code reset', 'Կոդը վերականգնված է'), { icon: <RotateCcw className="h-4 w-4" /> })
  }, [clearOutput, language, localize, tr])

  const changeLanguage = useCallback((nextLanguage: PlaygroundLanguage) => {
    setCode((current) => {
      const challenge = CHALLENGES.find((item) => item.id === activeChallenge)
      if (challenge) return current
      const isUntouchedStarter = Object.values(STARTERS).some(
        (starter) => Object.values(starter).includes(current)
      )
      return isUntouchedStarter ? STARTERS[nextLanguage][locale] : current
    })
    setLanguage(nextLanguage)
    clearOutput()
  }, [activeChallenge, clearOutput, locale])

  const askHint = useCallback(async () => {
    setHintLoading(true)
    setTab('hint')
    setHint(null)
    try {
      const challenge = CHALLENGES.find((c) => c.id === activeChallenge)
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          error,
          language,
          locale,
          task: challenge ? `${localize(challenge.title)}: ${localize(challenge.desc)}` : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHint(data.hint)
      toast.success(tr('AI-наставник ответил', 'AI tutor responded', 'AI ուսուցիչը պատասխանեց'), { icon: <Sparkles className="h-4 w-4" /> })
    } catch {
      toast.error(tr('Не удалось получить подсказку', 'Could not get a hint', 'Չհաջողվեց հուշում ստանալ'))
    } finally {
      setHintLoading(false)
    }
  }, [code, error, language, locale, activeChallenge, localize, tr])

  const loadChallenge = useCallback((c: Challenge) => {
    setCode(localize(c.code))
    setActiveChallenge(c.id)
    clearOutput()
    toast(`${tr('Загружено:', 'Loaded:', 'Բեռնված է՝')} ${localize(c.title)}`, { icon: <Code2 className="h-4 w-4" /> })
  }, [clearOutput, localize, tr])

  // Keyboard: Ctrl+Enter to run
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  // Handle textarea scroll sync + tab key
  function onEditorScroll() {
    if (gutterRef.current && editorRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop
    }
  }
  function onEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = code.slice(0, start) + '  ' + code.slice(end)
      setCode(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const lineCount = code.split('\n').length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  const hasOutput = logs.length > 0 || error || result !== null

  return (
    <PageSection>
      <SectionHeader
        title={tr('Песочница кода', 'Code playground', 'Կոդի փորձադաշտ')}
        subtitle={tr('Пиши JavaScript или TypeScript, запускай в безопасной песочнице и получай подсказки от AI', 'Write JavaScript or TypeScript, run it safely, and get hints from AI', 'Գրիր JavaScript կամ TypeScript, անվտանգ գործարկիր այն և ստացիր AI հուշումներ')}
        icon={Terminal}
        action={
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            {language === 'javascript' ? 'JavaScript' : 'TypeScript'}
            <span className="mx-1 h-3 w-px bg-border" />
            <kbd className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px]">Ctrl+↵</kbd>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={language} onValueChange={(value) => changeLanguage(value as PlaygroundLanguage)}>
          <SelectTrigger className="w-[140px] bg-card/60" aria-label={tr('Язык кода', 'Code language', 'Կոդի լեզու')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={run}
          disabled={running}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {tr('Запустить', 'Run', 'Գործարկել')}
        </Button>
        <Button variant="outline" onClick={askHint} disabled={hintLoading}>
          {hintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4 text-amber-400" />}
          {tr('AI-подсказка', 'AI hint', 'AI հուշում')}
        </Button>
        <Button variant="ghost" onClick={clearOutput} disabled={!hasOutput}>
          <Trash2 className="h-4 w-4" />
          {tr('Очистить', 'Clear', 'Մաքրել')}
        </Button>
        <Button variant="ghost" onClick={resetCode}>
          <RotateCcw className="h-4 w-4" />
          {tr('Сброс', 'Reset', 'Վերականգնել')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(code)
            toast.success(tr('Код скопирован', 'Code copied', 'Կոդը պատճենված է'), { icon: <Copy className="h-4 w-4" /> })
          }}
        >
          <Copy className="h-4 w-4" />
          {tr('Копировать', 'Copy', 'Պատճենել')}
        </Button>
      </div>

      {/* Editor + Output grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Code editor */}
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/70" />
                <div className="h-3 w-3 rounded-full bg-amber-500/70" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                script.{language === 'javascript' ? 'js' : 'ts'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{lineCount} {tr('строк', 'lines', 'տող')}</span>
          </div>
          <div className="relative flex" style={{ height: '460px' }}>
            {/* Line numbers gutter */}
            <div
              ref={gutterRef}
              className="select-none overflow-hidden border-r border-border/40 bg-muted/20 px-3 py-3 text-right font-mono text-xs leading-[1.5] text-muted-foreground/60"
              style={{ minWidth: '3rem' }}
              aria-hidden
            >
              {lineNumbers.map((n) => (
                <div key={n} className="tabular-nums">
                  {n}
                </div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={onEditorScroll}
              onKeyDown={onEditorKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-[1.5] text-foreground outline-none"
              placeholder={tr('// Пиши код здесь...', '// Write code here...', '// Գրիր կոդն այստեղ...')}
            />
          </div>
        </GlassCard>

        {/* Output panel */}
        <GlassCard className="overflow-hidden" hover={false}>
          {/* Tabs */}
          <div className="flex border-b border-border/60">
            <button
              onClick={() => setTab('console')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors',
                tab === 'console'
                  ? 'border-b-2 border-emerald-500 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              {tr('Консоль', 'Console', 'Վահանակ')}
              {logs.length > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                  {logs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('hint')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors',
                tab === 'hint'
                  ? 'border-b-2 border-amber-500 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              {tr('AI-наставник', 'AI tutor', 'AI ուսուցիչ')}
              {hint && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
            </button>
          </div>

          {/* Console content */}
          {tab === 'console' && (
            <div className="h-[460px] overflow-y-auto p-4 font-mono text-xs">
              {running && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {tr('Выполняется...', 'Running...', 'Գործարկվում է...')}
                </div>
              )}
              {!hasOutput && !running && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <Terminal className="h-8 w-8 opacity-30" />
                  <p className="text-xs">{tr('Нажми «Запустить» — вывод появится здесь', 'Press “Run” and the output will appear here', 'Սեղմիր «Գործարկել», և արդյունքը կհայտնվի այստեղ')}</p>
                </div>
              )}
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'flex items-start gap-2 rounded px-2 py-1',
                      log.type === 'error' && 'bg-rose-500/10 text-rose-300',
                      log.type === 'warn' && 'bg-amber-500/10 text-amber-300',
                      log.type === 'info' && 'text-sky-300',
                      log.type === 'log' && 'text-foreground'
                    )}
                  >
                    <span className="select-none opacity-40">
                      {log.type === 'error' ? '✕' : log.type === 'warn' ? '⚠' : '›'}
                    </span>
                    <span className="break-all">{log.args.join(' ')}</span>
                  </motion.div>
                ))}
              </div>
              {error && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">{tr('Ошибка выполнения', 'Runtime error', 'Կատարման սխալ')}</p>
                    <p className="mt-0.5 break-all text-rose-200/80">{error}</p>
                  </div>
                </div>
              )}
              {result !== null && !error && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="break-all">{tr('Результат:', 'Result:', 'Արդյունք։')} {result}</span>
                </div>
              )}
            </div>
          )}

          {/* AI hint content */}
          {tab === 'hint' && (
            <div className="h-[460px] overflow-y-auto p-4">
              {hintLoading && (
                <div className="space-y-2">
                  {[100, 92, 96, 80, 88, 70, 94, 60].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 animate-pulse rounded bg-muted"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              )}
              {!hintLoading && !hint && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                    <Lightbulb className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-medium">{tr('AI-наставник по коду', 'AI coding tutor', 'AI ծրագրավորման ուսուցիչ')}</p>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                      {tr('Нажми «AI-подсказка» — наставник разберёт твой код, объяснит ошибки и подскажет, как улучшить.', 'Press “AI hint” and the tutor will review your code, explain errors, and suggest improvements.', 'Սեղմիր «AI հուշում», և ուսուցիչը կվերլուծի կոդդ, կբացատրի սխալները ու կառաջարկի բարելավումներ։')}
                    </p>
                  </div>
                </div>
              )}
              {!hintLoading && hint && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose-ai"
                >
                  <ReactMarkdown>{hint}</ReactMarkdown>
                </motion.div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Challenges */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{tr('Упражнения для разминки', 'Warm-up exercises', 'Նախավարժանքներ')}</h3>
          <span className="text-xs text-muted-foreground">— {tr('кликни, чтобы загрузить', 'click to load', 'սեղմիր բեռնելու համար')}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHALLENGES.map((c) => {
            const isActive = activeChallenge === c.id
            return (
              <button
                key={c.id}
                onClick={() => loadChallenge(c)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border p-4 text-left transition-all',
                  isActive
                    ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/70'
                )}
              >
                {isActive && (
                  <div className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    ✓
                  </div>
                )}
                <p className="text-sm font-semibold">{localize(c.title)}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{localize(c.desc)}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Hidden sandbox iframe */}
      <iframe
        ref={iframeRef}
        title="sandbox"
        sandbox="allow-scripts"
        className="pointer-events-none fixed h-0 w-0 opacity-0"
        aria-hidden
      />
    </PageSection>
  )
}
