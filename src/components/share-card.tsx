'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  Sparkles,
  Loader2,
  Wand2,
  Trophy,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUser } from '@/lib/store'
import { ACHIEVEMENTS, levelProgress } from '@/lib/gamify-client'
import { cn } from '@/lib/utils'

interface ShareCardProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  achievements: { type: string; unlockedAt: string | Date }[]
}

const STYLES = [
  { id: 'cosmic', label: 'Космос', emoji: '🌌' },
  { id: 'aurora', label: 'Сияние', emoji: '🌠' },
  { id: 'geometric', label: 'Геометрия', emoji: '🔷' },
  { id: 'fluid', label: 'Поток', emoji: '🌊' },
]

const CANVAS_W = 1200
const CANVAS_H = 630

export function ShareCard({ open, onOpenChange, achievements }: ShareCardProps) {
  const { name, xp, level, streak } = useUser()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [artUrl, setArtUrl] = useState<string | null>(null)
  const [artLoading, setArtLoading] = useState(false)
  const [activeStyle, setActiveStyle] = useState('cosmic')
  const [useGradient, setUseGradient] = useState(true)

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

    // Background
    if (bgImage) {
      // Cover-fit the AI art
      const imgRatio = bgImage.width / bgImage.height
      const canvasRatio = CANVAS_W / CANVAS_H
      let dw = CANVAS_W
      let dh = CANVAS_H
      let dx = 0
      let dy = 0
      if (imgRatio > canvasRatio) {
        dh = CANVAS_H
        dw = dh * imgRatio
        dx = (CANVAS_W - dw) / 2
      } else {
        dw = CANVAS_W
        dh = dw / imgRatio
        dy = (CANVAS_H - dh) / 2
      }
      ctx.drawImage(bgImage, dx, dy, dw, dh)
      // Dark overlay for readability
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, 'rgba(10, 6, 23, 0.55)')
      grad.addColorStop(1, 'rgba(10, 6, 23, 0.92)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    } else {
      // Default cosmic gradient
      const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
      grad.addColorStop(0, '#1e0a3c')
      grad.addColorStop(0.5, '#2d0a4e')
      grad.addColorStop(1, '#0a0613')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      // Subtle radial glow
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
      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      for (let i = 0; i < 80; i++) {
        const x = (i * 37 + 13) % CANVAS_W
        const y = (i * 71 + 29) % CANVAS_H
        const r = (i % 3) * 0.6 + 0.4
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
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

    // Lumina wordmark
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 30px ui-sans-serif, system-ui, -apple-system, sans-serif'
    ctx.fillText('Lumina', 132, 88)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('Учись всему. Бесплатно. Навсегда.', 132, 108)

    // Date (top-right)
    const dateStr = new Date().toLocaleDateString('ru-RU', {
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
    const displayName = name.length > 18 ? name.slice(0, 18) + '…' : name
    ctx.fillText(displayName, 60, 230)

    ctx.fillStyle = 'rgba(217, 70, 239, 1)'
    ctx.font = '600 22px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(`Уровень ${level} · ${lp.pct}% к след. уровню`, 60, 270)

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
      { icon: '⚡', value: xp.toLocaleString('ru-RU'), label: 'XP' },
      { icon: '🔥', value: String(streak), label: 'дней подряд' },
      { icon: '🏆', value: String(level), label: 'уровень' },
      { icon: '🎖️', value: `${unlockedCount}/${totalAchievements}`, label: 'достижений' },
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
    ctx.fillText('lumina · AI-обучающая платформа', CANVAS_W - 60, CANVAS_H - 40)
    ctx.textAlign = 'left'
  }, [bgImage, name, xp, level, streak, unlockedCount, totalAchievements, lp.pct])

  useEffect(() => {
    if (open) draw()
  }, [open, draw, bgImage])

  // Load AI art image when artUrl changes
  useEffect(() => {
    if (!artUrl) {
      setBgImage(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setBgImage(img)
      setUseGradient(false)
    }
    img.onerror = () => {
      toast.error('Не удалось загрузить арт-фон')
      setBgImage(null)
    }
    img.src = artUrl
  }, [artUrl])

  const generateArt = useCallback(
    async (styleId: string) => {
      setArtLoading(true)
      setActiveStyle(styleId)
      try {
        const res = await fetch('/api/share-art', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ style: styleId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setArtUrl(data.image)
        toast.success(`Сгенерирован арт: «${data.styleLabel}»`, {
          icon: <Wand2 className="h-4 w-4" />,
        })
      } catch {
        toast.error('Не удалось сгенерировать арт. Попробуйте ещё раз.')
      } finally {
        setArtLoading(false)
      }
    },
    []
  )

  const download = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lumina-${name}-${level}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Карточка сохранена', { icon: <Download className="h-4 w-4" /> })
    }, 'image/png')
  }, [name, level])

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-2xl"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary ring-1 ring-primary/20">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Карточка прогресса</h3>
                  <p className="text-xs text-muted-foreground">
                    Поделись своими успехами в Lumina
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Закрыть"
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
                {artLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">AI создаёт уникальный арт…</p>
                  </div>
                )}
              </div>

              {/* Style picker */}
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Wand2 className="h-3 w-3" />
                  AI-арт фон
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => generateArt(s.id)}
                      disabled={artLoading}
                      className={cn(
                        'group relative overflow-hidden rounded-xl border p-3 text-left transition-all disabled:opacity-50',
                        activeStyle === s.id && !useGradient
                          ? 'border-primary/50 bg-primary/10 shadow-md shadow-primary/10'
                          : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/70'
                      )}
                    >
                      <div className="text-lg">{s.emoji}</div>
                      <div className="mt-1 text-xs font-medium">{s.label}</div>
                      {activeStyle === s.id && !useGradient && (
                        <div className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setArtUrl(null)
                      setUseGradient(true)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors',
                      useGradient
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Космический градиент
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    +8 XP за генерацию арта
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                {unlockedCount} из {totalAchievements} достижений · {xp} XP
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Закрыть
                </Button>
                <Button
                  onClick={download}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 hover:from-violet-600 hover:to-fuchsia-600"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  Скачать PNG
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
