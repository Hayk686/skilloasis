import Link from 'next/link'
import { Heart, Github, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Lumina</p>
              <p className="text-xs text-muted-foreground leading-tight">
                Бесплатно. Навсегда.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              О проекте
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Предметы
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Сообщество
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Конфиденциальность
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="GitHub"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Сделано с <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> для знаний
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lumina. Все знания — общее достояние.
        </div>
      </div>
    </footer>
  )
}
