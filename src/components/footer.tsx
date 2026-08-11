'use client'

import Link from 'next/link'
import { Heart, Github, Sparkles } from 'lucide-react'
import { useTranslations } from '@/lib/i18n-client'

export function Footer() {
  const { t } = useTranslations()
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">SkillOasis</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {t('footerFree')}
              </p>
            </div>
          </div>

          <nav className="grid w-full max-w-sm grid-cols-2 gap-2 text-center text-sm text-muted-foreground sm:flex sm:w-auto sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 lg:gap-x-6">
            <Link href="#" className="inline-flex items-center justify-center rounded-lg px-3 transition-colors hover:bg-accent/50 hover:text-foreground">
              {t('footerAbout')}
            </Link>
            <Link href="#" className="inline-flex items-center justify-center rounded-lg px-3 transition-colors hover:bg-accent/50 hover:text-foreground">
              {t('footerSubjects')}
            </Link>
            <Link href="#" className="inline-flex items-center justify-center rounded-lg px-3 transition-colors hover:bg-accent/50 hover:text-foreground">
              {t('footerCommunity')}
            </Link>
            <Link href="#" className="inline-flex items-center justify-center rounded-lg px-3 transition-colors hover:bg-accent/50 hover:text-foreground">
              {t('footerPrivacy')}
            </Link>
          </nav>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              aria-label="GitHub"
              className="grid h-11 w-11 place-items-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground lg:h-9 lg:w-9 lg:rounded-lg"
            >
              <Github className="h-4 w-4" />
            </a>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {t('footerMade')} <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> {t('footerForKnowledge')}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkillOasis. {t('footerCopyright')}
        </div>
      </div>
    </footer>
  )
}
