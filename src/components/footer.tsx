'use client'

import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Github, Heart, Sparkles } from 'lucide-react'
import { useTranslations } from '@/lib/i18n-client'

export function Footer() {
  const { t, tr } = useTranslations()
  const footerRef = useRef<HTMLElement>(null)
  const pointerRef = useRef({ x: 50, y: 60 })
  const frameRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
  }, [])

  function moveGlow(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === 'touch') return
    const footer = footerRef.current
    if (!footer) return
    const bounds = footer.getBoundingClientRect()
    pointerRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    }
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      footer.style.setProperty('--footer-glow-x', `${pointerRef.current.x}%`)
      footer.style.setProperty('--footer-glow-y', `${pointerRef.current.y}%`)
      footer.dataset.glowActive = 'true'
      frameRef.current = null
    })
  }

  function hideGlow() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    footerRef.current?.removeAttribute('data-glow-active')
  }

  return (
    <footer
      ref={footerRef}
      onPointerMove={moveGlow}
      onPointerLeave={hideGlow}
      className="interactive-footer relative isolate mt-auto overflow-hidden border-t border-border/70 bg-[#05050b] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:text-white dark:shadow-none xl:pl-64"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(250,245,255,0.96)_48%,rgba(236,254,255,0.92))] dark:hidden" />
      <div aria-hidden className="footer-spotlight pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(71,85,105,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.055)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)] dark:bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)]" />

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="grid gap-10 border-b border-border/70 pb-10 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr] lg:gap-14">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400">
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <span>
                <span className="block text-base font-bold leading-tight">Info Oasis</span>
                <span className="block text-xs text-muted-foreground dark:text-white/50">{t('footerFree')}</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground dark:text-white/55">
              {tr(
                'Обучение с AI, которое превращает сложные идеи в понятные и полезные знания.',
                'AI-powered learning that turns difficult ideas into clear, useful knowledge.',
                'AI-ով ուսուցում, որը բարդ գաղափարները վերածում է պարզ ու օգտակար գիտելիքի։'
              )}
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-white/40">
              {tr('Изучай', 'Explore', 'Բացահայտիր')}
            </p>
            <nav className="flex flex-col items-start gap-1 text-sm">
              <FooterLink href="/subjects">{t('footerSubjects')}</FooterLink>
              <FooterLink href="/services">{t('footerServices')}</FooterLink>
              <FooterLink href="/community">{t('footerCommunity')}</FooterLink>
            </nav>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-white/40">
              Info Oasis
            </p>
            <nav className="flex flex-col items-start gap-1 text-sm">
              <FooterLink href="/about">{t('footerAbout')}</FooterLink>
              <FooterLink href="/privacy">{t('footerPrivacy')}</FooterLink>
              <a
                href="https://github.com/Hayk686/skilloasis"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-muted-foreground transition-colors hover:text-foreground dark:text-white/60 dark:hover:text-white lg:min-h-9"
              >
                GitHub
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </nav>
          </div>
        </div>

        <div className="relative flex min-h-24 items-start justify-between gap-4 py-5 sm:min-h-20">
          <a
            href="https://github.com/Hayk686/skilloasis"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="relative z-10 grid h-11 w-11 place-items-center rounded-xl border border-border/80 bg-background/35 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground dark:border-white/10 dark:bg-transparent dark:text-white/55 dark:hover:border-white/25 dark:hover:text-white"
          >
            <Github className="h-4 w-4" />
          </a>

          <div className="relative z-10 flex flex-col items-end gap-1 text-right text-xs text-muted-foreground dark:text-white/45 sm:flex-row sm:items-center sm:gap-2">
            <span className="flex items-center gap-1.5">
              {t('footerMade')} <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> {t('footerForKnowledge')}
            </span>
            <span className="hidden text-border dark:text-white/20 sm:inline">•</span>
            <span>© {new Date().getFullYear()} Info Oasis</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-muted-foreground transition-colors hover:text-foreground dark:text-white/60 dark:hover:text-white lg:min-h-9"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  )
}
