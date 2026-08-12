'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/** Page section wrapper with consistent padding. */
export function PageSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <div id={id} className={cn('mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 2xl:px-10', className)}>
      {children}
    </div>
  )
}

/** Section title with optional subtitle + action. */
export function SectionHeader({
  title,
  subtitle,
  action,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:items-end">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary ring-1 ring-primary/20">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

/** Glass card with gradient border option. */
export function GlassCard({
  children,
  className,
  gradient,
  hover = true,
}: {
  children: React.ReactNode
  className?: string
  gradient?: boolean
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        'ambient-card relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl dark:border-border/60 dark:bg-card/60',
        hover && 'transition-all hover:border-border hover:shadow-xl hover:shadow-primary/5',
        className
      )}
    >
      {gradient && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      )}
      {children}
    </div>
  )
}

/** Loading spinner with optional label. */
export function LoadingState({
  label = 'Загрузка...',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16 text-muted-foreground', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/** Empty state with icon and message. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/** Staggered fade-in container. */
export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -7% 0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.075 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Pill badge. */
export function Pill({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  )
}

/** Primary gradient button (for CTAs). */
export function GradientButton({
  children,
  onClick,
  className,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:shadow-xl hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  )
}
