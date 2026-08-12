import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

interface InformationSection {
  title: string
  content: string
}

export function InformationPage({
  eyebrow,
  title,
  description,
  sections,
  ctaLabel = 'Start learning',
  ctaHref = '/',
}: {
  eyebrow: string
  title: string
  description: string
  sections: InformationSection[]
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(var(--chart-2)/0.12),transparent_30%)]" />
      <header className="relative border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-xl pr-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span className="font-bold tracking-tight">Info Oasis</span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {description}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm sm:p-7"
            >
              <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">{section.content}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex justify-center lg:mt-16">
          <Link
            href={ctaHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-transform hover:-translate-y-0.5"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
