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
  ru: 'Write every natural-language word in fluent Russian. Do not switch to English or another language unless the user explicitly asks.',
  en: 'Write every natural-language word in fluent English. Do not switch to another language unless the user explicitly asks.',
  hy: 'Write every natural-language word in fluent Eastern Armenian using the Armenian alphabet. Do not use Russian, English, or Latin transliteration unless the user explicitly asks.',
}
