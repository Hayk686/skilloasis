'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/lib/i18n-client'
import { useUser } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { getSupabasePublicConfig } from '@/lib/supabase/config'
import { localizeUserName } from '@/lib/i18n-config'

type AuthMode = 'signin' | 'signup'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.18 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  )
}

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { locale, tr } = useTranslations()
  const { name: currentName, email: currentEmail, authenticated } = useUser()
  const currentDisplayName = localizeUserName(currentName, locale)
  const [mode, setMode] = useState<AuthMode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const configured = Boolean(getSupabasePublicConfig())

  useEffect(() => {
    if (!open) return
    setError(null)
    setMessage(null)
    setPassword('')
    setShowPassword(false)
  }, [open, mode])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (authError) throw authError
        if (!data.session) {
          setMessage(tr(
            'Проверьте почту и подтвердите регистрацию.',
            'Check your email to confirm your account.',
            'Ստուգեք էլփոստը՝ հաշիվը հաստատելու համար։'
          ))
          return
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
      }
      window.location.reload()
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : tr(
        'Не удалось войти.',
        'Could not sign in.',
        'Չհաջողվեց մուտք գործել։'
      ))
    } finally {
      setBusy(false)
    }
  }

  async function continueWithGoogle() {
    setBusy(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (authError) throw authError
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : tr(
        'Не удалось открыть Google.',
        'Could not open Google sign-in.',
        'Չհաջողվեց բացել Google մուտքը։'
      ))
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/auth/signout', { method: 'POST' })
      if (!response.ok) throw new Error('Sign out failed')
      useUser.persist.clearStorage()
      localStorage.removeItem('lumina-user')
      window.location.reload()
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Sign out failed')
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-950/65 backdrop-blur-md"
        className="max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto rounded-[1.75rem] border-primary/20 bg-background/88 p-0 shadow-[0_32px_100px_-28px_rgba(88,28,135,0.75)] backdrop-blur-2xl sm:max-w-[460px]"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
        {authenticated ? (
          <div className="relative p-7">
            <DialogHeader>
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25 ring-1 ring-white/25">
                <UserRound className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">{currentDisplayName}</DialogTitle>
              <DialogDescription>{currentEmail}</DialogDescription>
            </DialogHeader>
            <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700 shadow-sm dark:text-emerald-300">
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              {tr(
                'Прогресс сохранён в вашем аккаунте.',
                'Your progress is saved to your account.',
                'Ձեր առաջընթացը պահպանված է հաշվում։'
              )}
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <Button className="mt-6 h-12 w-full rounded-xl bg-background/70" variant="outline" onClick={signOut} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <LogOut />}
              {tr('Выйти', 'Sign out', 'Դուրս գալ')}
            </Button>
          </div>
        ) : (
          <div className="relative p-6 sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-5 pr-7">
              <DialogHeader className="min-w-0 text-left">
                <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/25">
                  <Sparkles className="h-5 w-5" />
                </div>
                <DialogTitle className="text-2xl font-bold leading-tight tracking-tight sm:text-[1.7rem]">
                  {mode === 'signin'
                    ? tr('Войдите в аккаунт', 'Sign in to your account', 'Մուտք գործեք ձեր հաշիվ')
                    : tr('Создайте аккаунт', 'Create your account', 'Ստեղծեք ձեր հաշիվը')}
                </DialogTitle>
                <DialogDescription className="max-w-[280px] text-sm leading-relaxed">
                  {mode === 'signin'
                    ? tr(
                        'Продолжите обучение с того места, где остановились.',
                        'Continue learning exactly where you left off.',
                        'Շարունակեք ուսուցումը հենց այնտեղից, որտեղ կանգ եք առել։'
                      )
                    : tr(
                        'Сохраняйте прогресс и учитесь на любом устройстве.',
                        'Save your progress and learn on any device.',
                        'Պահպանեք առաջընթացը և սովորեք ցանկացած սարքից։'
                      )}
                </DialogDescription>
              </DialogHeader>
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="mt-1 shrink-0 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
              >
                {mode === 'signin'
                  ? tr('Регистрация', 'Sign up', 'Գրանցում')
                  : tr('Войти', 'Sign in', 'Մուտք')}
              </button>
            </div>

            <div className="space-y-5">
              {!configured && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  {tr(
                    'Supabase Auth ещё не настроен.',
                    'Supabase Auth is not configured yet.',
                    'Supabase Auth-ը դեռ կարգավորված չէ։'
                  )}
                </p>
              )}

              <form className="space-y-4" onSubmit={submit}>
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-name" className="text-sm font-medium">{tr('Имя', 'Name', 'Անուն')}</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="auth-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                        maxLength={32}
                        placeholder={tr('Ваше имя', 'Your name', 'Ձեր անունը')}
                        className="h-12 rounded-xl border-border/80 bg-background/65 pl-11 shadow-sm focus-visible:bg-background"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auth-email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      className="h-12 rounded-xl border-border/80 bg-background/65 pl-11 shadow-sm focus-visible:bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password" className="text-sm font-medium">{tr('Пароль', 'Password', 'Գաղտնաբառ')}</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      minLength={8}
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-border/80 bg-background/65 px-11 shadow-sm focus-visible:bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={showPassword
                        ? tr('Скрыть пароль', 'Hide password', 'Թաքցնել գաղտնաբառը')
                        : tr('Показать пароль', 'Show password', 'Ցույց տալ գաղտնաբառը')}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {message && <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-fuchsia-500/30"
                  type="submit"
                  disabled={busy || !configured}
                >
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === 'signin'
                    ? tr('Войти', 'Sign in', 'Մուտք գործել')
                    : tr('Создать аккаунт', 'Create account', 'Ստեղծել հաշիվ')}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                {tr('или', 'or', 'կամ')}
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-xl border-border/80 bg-background/65 font-medium shadow-sm hover:border-primary/30 hover:bg-primary/5"
                onClick={continueWithGoogle}
                disabled={busy || !configured}
              >
                {busy ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
                {tr('Войти через Google', 'Continue with Google', 'Շարունակել Google-ով')}
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                {tr(
                  'Продолжая, вы соглашаетесь с условиями и политикой конфиденциальности Info Oasis.',
                  'By continuing, you agree to the Info Oasis terms and privacy policy.',
                  'Շարունակելով՝ դուք համաձայնում եք Info Oasis-ի պայմաններին և գաղտնիության քաղաքականությանը։'
                )}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
