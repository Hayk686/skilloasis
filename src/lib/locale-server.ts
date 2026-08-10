import { cookies } from 'next/headers'
import {
  DEFAULT_LOCALE,
  isLocale,
  LANGUAGE_INSTRUCTIONS,
  type Locale,
} from '@/lib/i18n-config'

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value =
    cookieStore.get('skilloasis_locale')?.value ??
    cookieStore.get('lumina_locale')?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export async function getLanguageInstruction(): Promise<string> {
  return LANGUAGE_INSTRUCTIONS[await getRequestLocale()]
}
