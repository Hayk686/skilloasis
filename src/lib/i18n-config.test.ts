import { describe, expect, it } from 'vitest'
import { isLocale, LANGUAGE_INSTRUCTIONS, SUPPORTED_LOCALES } from './i18n-config'

describe('locale configuration', () => {
  it('recognizes every supported locale', () => {
    expect(SUPPORTED_LOCALES.every(isLocale)).toBe(true)
    expect(isLocale('de')).toBe(false)
  })

  it('has an AI language instruction for every locale', () => {
    expect(SUPPORTED_LOCALES.every((locale) => LANGUAGE_INSTRUCTIONS[locale].length > 20)).toBe(true)
  })
})
