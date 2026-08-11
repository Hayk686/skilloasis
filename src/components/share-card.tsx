'use client'

import { useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUser } from '@/lib/store'
import { ACHIEVEMENTS, levelProgress } from '@/lib/gamify-client'
import { useTranslations } from '@/lib/i18n-client'
import { localizeUserName } from '@/lib/i18n-config'

interface ShareCardProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  achievements: { type: string; unlockedAt: string | Date }[]
}

const CANVAS_W = 1200
const CANVAS_H = 630

export function ShareCard({ open, onOpenChange, achievements }: ShareCardProps) {
  const { name, xp, level, streak } = useUser()
  const { locale, dateLocale, tr } = useTranslations()
  const displayName = localizeUserName(name, locale)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const unlockedCount = achievements.length
  const totalAchievements = ACHIEVEMENTS.length
  const lp = levelProgress(xp)

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_W
    canvas.height = CANVAS_H

    // Cosmic gradient background
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
    grad.addColorStop(0, '#1e0a3c')
    grad.addColorStop(0.5, '#2d0a4e')
    grad.addColorStop(1, '#0a0613')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    const glow = ctx.createRadialGradient(
      CANVAS_W * 0.75,
      CANVAS_H * 0.3,
      0,
      CANVAS_W * 0.75,
      CANVAS_H * 0.3,
      500
    )
    glow.addColorStop(0, 'rgba(217, 70, 239, 0.35)')
    glow.addColorStop(1, 'rgba(217, 70, 239, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    const glow2 = ctx.createRadialGradient(
      CANVAS_W * 0.2,
      CANVAS_H * 0.8,
      0,
      CANVAS_W * 0.2,
      CANVAS_H * 0.8,
      400
    )
    glow2.addColorStop(0, 'rgba(139, 92, 246, 0.3)')
    glow2.addColorStop(1, 'rgba(139, 92, 246, 0)')
    ctx.fillStyle = glow2
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    for (let i = 0; i < 80; i++) {
      const x = (i * 37 + 13) % CANVAS_W
      const y = (i * 71 + 29) % CANVAS_H
      const r = (i % 3) * 0.6 + 0.4
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Top gradient border line
    const topGrad = ctx.createLinearGradient(0, 0, CANVAS_W, 0)
    topGrad.addColorStop(0, 'rgba(139, 92, 246, 0)')
    topGrad.addColorStop(0.5, 'rgba(217, 70, 239, 0.9)')
    topGrad.addColorStop(1, 'rgba(244, 114, 182, 0)')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, CANVAS_W, 3)

    // Logo (top-left)
    ctx.save()
    const logoX = 60
    const logoY = 60
    // Logo circle gradient
    const logoGrad = ctx.createLinearGradient(logoX, logoY, logoX + 56, logoY + 56)
    logoGrad.addColorStop(0, '#8b5cf6')
    logoGrad.addColorStop(0.5, '#d946ef')
    logoGrad.addColorStop(1, '#ec4899')
    ctx.fillStyle = logoGrad
    ctx.beginPath()
    ctx.roundRect(logoX, logoY, 56, 56, 16)
    ctx.fill()
    // Sparkle (simple 4-point star)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    const cx = logoX + 28
    const cy = logoY + 28
    ctx.moveTo(cx, cy - 12)
    ctx.quadraticCurveTo(cx + 3, cy - 3, cx + 12, cy)
    ctx.quadraticCurveTo(cx + 3, cy + 3, cx, cy + 12)
    ctx.quadraticCurveTo(cx - 3, cy + 3, cx - 12, cy)
    ctx.quadraticCurveTo(cx - 3, cy - 3, cx, cy - 12)
    ctx.fill()
    ctx.restore()

    // SkillOasis wordmark
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 30px ui-sans-serif, system-ui, -apple-system, sans-serif'
    ctx.fillText('SkillOasis', 132, 88)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(tr('Учись всему. Бесплатно. Навсегда.', 'Learn anything. Free. Forever.', 'Սովորիր ամեն ինչ։ Անվճար։ Ընդմիշտ։'), 132, 108)

    // Date (top-right)
    const dateStr = new Date().toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(dateStr, CANVAS_W - 60, 88)
    ctx.textAlign = 'left'

    // Name + tagline (center-left)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 56px ui-sans-serif, system-ui, sans-serif'
    const cardName = displayName.length > 18 ? displayName.slice(0, 18) + '…' : displayName
    ctx.fillText(cardName, 60, 230)

    ctx.fillStyle = 'rgba(217, 70, 239, 1)'
    ctx.font = '600 22px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(tr(`Уровень ${level} · ${lp.pct}% к след. уровню`, `Level ${level} · ${lp.pct}% to the next level`, `Մակարդակ ${level} · ${lp.pct}% մինչև հաջորդ մակարդակ`), 60, 270)

    // Progress bar
    const barX = 60
    const barY = 295
    const barW = 480
    const barH = 8
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barW, barH, 4)
    ctx.fill()
    const progGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
    progGrad.addColorStop(0, '#8b5cf6')
    progGrad.addColorStop(0.5, '#d946ef')
    progGrad.addColorStop(1, '#ec4899')
    ctx.fillStyle = progGrad
    ctx.beginPath()
    ctx.roundRect(barX, barY, (barW * lp.pct) / 100, barH, 4)
    ctx.fill()

    // Stats grid (4 cards bottom)
    const stats = [
      { icon: '⚡', value: xp.toLocaleString(dateLocale), label: 'XP' },
      { icon: '🔥', value: String(streak), label: tr('дней подряд', 'day streak', 'օր անընդմեջ') },
      { icon: '🏆', value: String(level), label: tr('уровень', 'level', 'մակարդակ') },
      { icon: '🎖️', value: `${unlockedCount}/${totalAchievements}`, label: tr('достижений', 'achievements', 'ձեռքբերում') },
    ]
    const cardW = 240
    const cardH = 110
    const cardGap = 20
    const startX = 60
    const startY = 360

    stats.forEach((s, i) => {
      const x = startX + i * (cardW + cardGap)
      // Card bg
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.beginPath()
      ctx.roundRect(x, startY, cardW, cardH, 16)
      ctx.fill()
      // Card border
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x, startY, cardW, cardH, 16)
      ctx.stroke()
      // Icon
      ctx.font = '32px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(s.icon, x + 20, startY + 48)
      // Value
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(s.value, x + 20, startY + 86)
      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(s.label, x + 20, startY + 102)
    })

    // Footer (right side)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(tr('SkillOasis · AI-обучающая платформа', 'SkillOasis · AI learning platform', 'SkillOasis · AI ուսուցման հարթակ'), CANVAS_W - 60, CANVAS_H - 40)
    ctx.textAlign = 'left'
  }, [displayName, xp, level, streak, unlockedCount, totalAchievements, lp.pct, dateLocale, tr])

  useEffect(() => {
    if (open) draw()
  }, [open, draw])

  const download = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `skilloasis-${displayName}-${level}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(tr('Карточка сохранена', 'Card saved', 'Քարտը պահպանված է'), { icon: <Download className="h-4 w-4" /> })
    }, 'image/png')
  }, [displayName, level, tr])

  // Esc to close
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-4"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-x-hidden overflow-y-auto rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-2xl sm:max-h-[calc(100dvh-2rem)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary ring-1 ring-primary/20">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">{tr('Карточка прогресса', 'Progress card', 'Առաջընթացի քարտ')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {tr('Поделись своими успехами в SkillOasis', 'Share your progress in SkillOasis', 'Կիսվիր SkillOasis-ում քո առաջընթացով')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={tr('Закрыть', 'Close', 'Փակել')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {/* Canvas preview */}
              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-black/40 shadow-inner">
                <canvas
                  ref={canvasRef}
                  className="block w-full"
                  style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                {unlockedCount} {tr('из', 'of', 'ընդամենը')} {totalAchievements} {tr('достижений', 'achievements', 'ձեռքբերում')} · {xp} XP
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  {tr('Закрыть', 'Close', 'Փակել')}
                </Button>
                <Button
                  onClick={download}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 hover:from-violet-600 hover:to-fuchsia-600"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  {tr('Скачать PNG', 'Download PNG', 'Ներբեռնել PNG')}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
