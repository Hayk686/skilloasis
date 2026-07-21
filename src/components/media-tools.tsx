'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Square, Loader2, ImageIcon, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ============================================================
 * AudioNarration — text-to-speech player with chunked playback.
 * Calls POST /api/tts with text (<=1000 chars), gets a WAV blob,
 * plays it via an <audio> element. For longer text, the caller
 * should pass a single coherent chunk (we handle one chunk here).
 * ============================================================ */

interface AudioState {
  loading: boolean
  playing: boolean
  url: string | null
}

export function AudioNarration({
  text,
  label = 'Слушать',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [state, setState] = useState<AudioState>({ loading: false, playing: false, url: null })
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const cleanText = text.replace(/[#*`>_~]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1000)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setState((s) => ({ ...s, playing: false }))
  }, [])

  const play = useCallback(async () => {
    if (!cleanText) return
    // If we already have the URL, just toggle play/pause
    if (state.url && audioRef.current) {
      if (state.playing) {
        audioRef.current.pause()
        setState((s) => ({ ...s, playing: false }))
      } else {
        audioRef.current.play()
        setState((s) => ({ ...s, playing: true }))
      }
      return
    }

    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'tongtong', speed: 1 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Ошибка TTS')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setState({ loading: false, playing: true, url })
      // wait for audio element to mount
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url
          audioRef.current.play().catch(() => {
            setState((s) => ({ ...s, playing: false }))
          })
        }
      }, 50)
      toast.success('Аудио готово ▶')
    } catch (e) {
      setState((s) => ({ ...s, loading: false }))
      toast.error(e instanceof Error ? e.message : 'Не удалось создать аудио')
    }
  }, [cleanText, state.url, state.playing])

  // cleanup
  useEffect(() => {
    return () => {
      if (state.url) URL.revokeObjectURL(state.url)
    }
  }, [state.url])

  return (
    <div className={cn('inline-flex items-center', className)}>
      <button
        onClick={state.playing ? stop : play}
        disabled={state.loading || !cleanText}
        className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
        aria-label={state.playing ? 'Остановить' : label}
      >
        {state.loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : state.playing ? (
          <span className="relative flex h-3.5 w-3.5 items-center justify-center">
            <EqualizerIcon active={state.playing} />
          </span>
        ) : (
          <Volume2 className="h-3.5 w-3.5 text-primary" />
        )}
        <span>{state.loading ? 'Готовлю аудио…' : state.playing ? 'Стоп' : label}</span>
      </button>
      {state.url && (
        <audio
          ref={audioRef}
          onEnded={() => setState((s) => ({ ...s, playing: false }))}
          onPause={() => setState((s) => ({ ...s, playing: false }))}
          onPlay={() => setState((s) => ({ ...s, playing: true }))}
          className="hidden"
        />
      )}
    </div>
  )
}

/** Tiny animated equalizer bars shown while playing. */
function EqualizerIcon({ active }: { active: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-primary"
          animate={active ? { height: ['35%', '100%', '50%', '90%', '40%'] } : { height: '40%' }}
          transition={{
            duration: 0.8,
            repeat: active ? Infinity : 0,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
          style={{ height: '40%' }}
        />
      ))}
    </span>
  )
}

/* ============================================================
 * LessonIllustration — AI-generated image for a lesson topic.
 * Calls POST /api/image with a prompt derived from the topic,
 * shows the result in a framed card with a gradient overlay.
 * ============================================================ */

export function LessonIllustration({
  topic,
  summary,
  className,
}: {
  topic: string
  summary?: string
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [url, setUrl] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (state === 'loading') return
    setState('loading')
    try {
      const prompt = summary ? `${topic}: ${summary.slice(0, 160)}` : topic
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: '1344x768' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUrl(data.url)
      setState('ready')
      toast.success('Иллюстрация готова ✨')
    } catch (e) {
      setState('error')
      toast.error(e instanceof Error ? e.message : 'Не удалось создать изображение')
    }
  }, [topic, summary, state])

  if (state === 'idle') {
    return (
      <button
        onClick={generate}
        className={cn(
          'group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5',
          className
        )}
      >
        <ImageIcon className="h-3.5 w-3.5 text-primary" />
        <span>Показать иллюстрацию</span>
      </button>
    )
  }

  if (state === 'loading') {
    return (
      <div
        className={cn(
          'relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10',
          className
        )}
      >
        <div className="absolute inset-0 animate-shimmer" />
        <div className="relative flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs">Рисую иллюстрацию…</span>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <button
        onClick={generate}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/20',
          className
        )}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Повторить</span>
      </button>
    )
  }

  // ready
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn('group relative overflow-hidden rounded-2xl border border-border/60', className)}
    >
      <img src={url!} alt={`Иллюстрация: ${topic}`} className="h-44 w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3">
        <span className="rounded-md bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          ✨ AI-иллюстрация
        </span>
        <button
          onClick={() => setState('idle')}
          className="grid h-7 w-7 place-items-center rounded-md bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          aria-label="Скрыть"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
