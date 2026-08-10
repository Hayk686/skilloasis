export const SUPPORTED_LOCALES = ['ru', 'en', 'hy'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale)
}

export const LANGUAGE_NAMES: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  hy: 'Հայերեն',
}

export const SITE_TITLES: Record<Locale, string> = {
  ru: 'Lumina — Учись всему. Бесплатно. Навсегда.',
  en: 'Lumina — Learn anything. Free. Forever.',
  hy: 'Lumina — Սովորիր ամեն ինչ։ Անվճար։ Ընդմիշտ։',
}

export const LANGUAGE_INSTRUCTIONS: Record<Locale, string> = {
  ru: 'Write all natural-language output in Russian.',
  en: 'Write all natural-language output in English.',
  hy: 'Write all natural-language output in fluent literary Armenian.',
}
