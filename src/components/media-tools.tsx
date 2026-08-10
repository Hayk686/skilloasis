'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n-client'

const SPEECH_LOCALES = {
  ru: 'ru-RU',
  en: 'en-US',
  hy: 'hy-AM',
} as const

/** Browser-native narration: no server API, external key, or generated audio file. */
export function AudioNarration({
  text,
  label,
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const { locale, tr } = useTranslations()
  const displayLabel = label ?? tr('Слушать', 'Listen', 'Լսել')
  const [playing, setPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const cleanText = text.replace(/[#*`>_~]/g, '').replace(/\s+/g, ' ').trim().slice(0, 4000)

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    utteranceRef.current = null
    setPlaying(false)
  }, [])

  const play = useCallback(() => {
    if (!cleanText) return
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      toast.error(tr('Озвучка не поддерживается этим браузером', 'Speech is not supported by this browser', 'Այս դիտարկիչը չի աջակցում ձայնավորմանը'))
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = SPEECH_LOCALES[locale]
    utterance.rate = 1

    const languagePrefix = utterance.lang.split('-')[0].toLowerCase()
    const matchingVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix))
    if (matchingVoice) utterance.voice = matchingVoice

    utterance.onend = () => {
      utteranceRef.current = null
      setPlaying(false)
    }
    utterance.onerror = () => {
      utteranceRef.current = null
      setPlaying(false)
      toast.error(tr('Не удалось воспроизвести озвучку', 'Could not play the narration', 'Չհաջողվեց նվագարկել ձայնավորումը'))
    }

    utteranceRef.current = utterance
    setPlaying(true)
    window.speechSynthesis.speak(utterance)
  }, [cleanText, locale, tr])

  useEffect(() => stop, [stop])

  return (
    <div className={cn('inline-flex items-center', className)}>
      <button
        onClick={playing ? stop : play}
        disabled={!cleanText}
        className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
        aria-label={playing ? tr('Остановить', 'Stop', 'Կանգնեցնել') : displayLabel}
      >
        {playing ? (
          <span className="relative flex h-3.5 w-3.5 items-center justify-center">
            <EqualizerIcon />
          </span>
        ) : (
          <Volume2 className="h-3.5 w-3.5 text-primary" />
        )}
        <span>{playing ? tr('Стоп', 'Stop', 'Կանգ') : displayLabel}</span>
      </button>
    </div>
  )
}

function EqualizerIcon() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="w-[2px] rounded-full bg-primary"
          animate={{ height: ['35%', '100%', '50%', '90%', '40%'] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.12,
            ease: 'easeInOut',
          }}
          style={{ height: '40%' }}
        />
      ))}
    </span>
  )
}
