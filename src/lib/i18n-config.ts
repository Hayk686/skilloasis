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

export const LANGUAGE_INSTRUCTIONS: Record<Locale, string> = {
  ru: 'Всегда отвечай на русском языке, если пользователь явно не попросил другой язык.',
  en: 'Always answer in English unless the user explicitly requests another language.',
  hy: 'Միշտ պատասխանիր գրական հայերենով, եթե օգտատերը հստակ չի խնդրել այլ լեզու։',
}
