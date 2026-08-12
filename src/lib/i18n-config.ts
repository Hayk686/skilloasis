export const SUPPORTED_LOCALES = ['ru', 'en', 'hy'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

export const DEFAULT_GUEST_NAME = 'Странник'

const GUEST_NAMES: Record<Locale, string> = {
  ru: 'Странник',
  en: 'Explorer',
  hy: 'Հետազոտող',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale)
}

export function localizeUserName(name: string, locale: Locale): string {
  return name === DEFAULT_GUEST_NAME ? GUEST_NAMES[locale] : name
}

export const LANGUAGE_NAMES: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  hy: 'Հայերեն',
}

export const LANGUAGE_INSTRUCTIONS: Record<Locale, string> = {
  ru: 'Write every natural-language word in fluent Russian. Do not switch to English or another language unless the user explicitly asks.',
  en: 'Write every natural-language word in fluent English. Do not switch to another language unless the user explicitly asks.',
  hy: 'Write every natural-language word in fluent Eastern Armenian using the Armenian alphabet. Use standard Armenian terminology and grammar. Do not use Russian, Persian, Arabic, English, or Latin transliteration unless the user explicitly asks. Before answering, silently verify that every prose sentence follows this rule; non-Armenian characters are allowed only in code, formulas, SI units, and proper names with no standard Armenian form.',
}
