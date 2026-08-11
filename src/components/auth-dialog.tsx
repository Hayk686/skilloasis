'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Loader2, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'
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
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const configured = Boolean(getSupabasePublicConfig())

  useEffect(() => {
    if (!open) return
    setError(null)
    setMessage(null)
    setPassword('')
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
      <DialogContent className="overflow-hidden border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md">
        {authenticated ? (
          <div className="p-6">
            <DialogHeader>
              <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                <UserRound className="h-5 w-5" />
              </div>
              <DialogTitle>{currentDisplayName}</DialogTitle>
              <DialogDescription>{currentEmail}</DialogDescription>
            </DialogHeader>
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-300">
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              {tr(
                'Прогресс сохранён в вашем аккаунте.',
                'Your progress is saved to your account.',
                'Ձեր առաջընթացը պահպանված է հաշվում։'
              )}
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <Button className="mt-5 w-full" variant="outline" onClick={signOut} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <LogOut />}
              {tr('Выйти', 'Sign out', 'Դուրս գալ')}
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent px-6 pb-5 pt-6">
              <DialogHeader>
                <DialogTitle>
                  {mode === 'signin'
                    ? tr('Вход в SkillOasis', 'Sign in to SkillOasis', 'Մուտք SkillOasis')
                    : tr('Создать аккаунт', 'Create an account', 'Ստեղծել հաշիվ')}
                </DialogTitle>
                <DialogDescription>
                  {tr(
                    'Сохраните свой прогресс и продолжайте на любом устройстве.',
                    'Save your progress and continue on any device.',
                    'Պահպանեք առաջընթացը և շարունակեք ցանկացած սարքից։'
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4 px-6 pb-6">
              {!configured && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  {tr(
                    'Supabase Auth ещё не настроен.',
                    'Supabase Auth is not configured yet.',
                    'Supabase Auth-ը դեռ կարգավորված չէ։'
                  )}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full bg-background"
                onClick={continueWithGoogle}
                disabled={busy || !configured}
              >
                {busy ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
                {tr('Продолжить с Google', 'Continue with Google', 'Շարունակել Google-ով')}
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                {tr('или по почте', 'or with email', 'կամ էլփոստով')}
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
                {(['signin', 'signup'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      mode === item ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    {item === 'signin'
                      ? tr('Войти', 'Sign in', 'Մուտք')
                      : tr('Регистрация', 'Sign up', 'Գրանցում')}
                  </button>
                ))}
              </div>

              <form className="space-y-4" onSubmit={submit}>
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-name">{tr('Имя', 'Name', 'Անուն')}</Label>
                    <Input
                      id="auth-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      maxLength={32}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password">{tr('Пароль', 'Password', 'Գաղտնաբառ')}</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={8}
                    required
                  />
                </div>

                {message && <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button className="w-full" type="submit" disabled={busy || !configured}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === 'signin'
                    ? tr('Войти', 'Sign in', 'Մուտք գործել')
                    : tr('Создать аккаунт', 'Create account', 'Ստեղծել հաշիվ')}
                </Button>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
