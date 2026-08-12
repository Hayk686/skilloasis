'use client'

import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import {
  DEFAULT_LOCALE,
  isLocale,
  LANGUAGE_NAMES,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/lib/i18n-config'

const translations = {
  ru: {
    tagline: 'учись всему',
    navigation: 'Навигация',
    menu: 'Меню',
    theme: 'Сменить тему',
    language: 'Язык',
    search: 'Поиск',
    account: 'Аккаунт',
    days: 'дней',
    levelShort: 'ур.',
    freeTitle: '100% бесплатно',
    freeDescription: 'Никаких подписок и платных функций. Знания принадлежат всем.',
    loadProfile: 'Загружаем твой профиль...',
    loadDashboard: 'Открываем дашборд...',
    loadTutor: 'Подключаем наставника...',
    loadLesson: 'Готовим урок...',
    loadQuiz: 'Готовим квиз...',
    loadFlashcards: 'Готовим флешкарты...',
    loadMindmap: 'Строим карту знаний...',
    loadPlayground: 'Открываем песочницу...',
    errorTitle: 'Что-то пошло не так',
    errorFallback: 'Не удалось загрузить раздел',
    retry: 'Попробовать снова',
    footerFree: 'Бесплатно. Навсегда.',
    footerAbout: 'О проекте',
    footerServices: 'Возможности',
    footerSubjects: 'Предметы',
    footerCommunity: 'Сообщество',
    footerPrivacy: 'Конфиденциальность',
    footerMade: 'Сделано с',
    footerForKnowledge: 'для знаний',
    footerCopyright: 'Все знания — общее достояние.',
    navHome: 'Главная',
    navHomeDesc: 'Стартовая страница',
    navDashboard: 'Дашборд',
    navDashboardDesc: 'Ваш прогресс',
    navTutor: 'AI-наставник',
    navTutorDesc: 'Чат с наставником',
    navLessons: 'Уроки',
    navLessonsDesc: 'Интерактивные уроки',
    navQuiz: 'Квиз-арена',
    navQuizDesc: 'Проверь себя',
    navFlashcards: 'Флешкарты',
    navFlashcardsDesc: 'Интервальное повторение',
    navPaths: 'Маршруты',
    navPathsDesc: 'Путь к цели',
    navMindmap: 'Карты знаний',
    navMindmapDesc: 'Визуальные концепт-карты',
    navPlayground: 'Песочница кода',
    navPlaygroundDesc: '9 языков + AI-наставник',
    navSubjects: 'Предметы',
    navSubjectsDesc: 'Все области',
    navAchievements: 'Достижения',
    navAchievementsDesc: 'Награды',
  },
  en: {
    tagline: 'learn anything',
    navigation: 'Navigation',
    menu: 'Menu',
    theme: 'Change theme',
    language: 'Language',
    search: 'Search',
    account: 'Account',
    days: 'days',
    levelShort: 'lvl.',
    freeTitle: '100% free',
    freeDescription: 'No subscriptions or paid features. Knowledge belongs to everyone.',
    loadProfile: 'Loading your profile...',
    loadDashboard: 'Opening dashboard...',
    loadTutor: 'Connecting your tutor...',
    loadLesson: 'Preparing lesson...',
    loadQuiz: 'Preparing quiz...',
    loadFlashcards: 'Preparing flashcards...',
    loadMindmap: 'Building knowledge map...',
    loadPlayground: 'Opening code playground...',
    errorTitle: 'Something went wrong',
    errorFallback: 'Could not load this section',
    retry: 'Try again',
    footerFree: 'Free. Forever.',
    footerAbout: 'About',
    footerServices: 'Services',
    footerSubjects: 'Subjects',
    footerCommunity: 'Community',
    footerPrivacy: 'Privacy',
    footerMade: 'Made with',
    footerForKnowledge: 'for knowledge',
    footerCopyright: 'Knowledge belongs to everyone.',
    navHome: 'Home', navHomeDesc: 'Start page',
    navDashboard: 'Dashboard', navDashboardDesc: 'Your progress',
    navTutor: 'AI tutor', navTutorDesc: 'Chat with your tutor',
    navLessons: 'Lessons', navLessonsDesc: 'Interactive lessons',
    navQuiz: 'Quiz arena', navQuizDesc: 'Test yourself',
    navFlashcards: 'Flashcards', navFlashcardsDesc: 'Spaced repetition',
    navPaths: 'Learning paths', navPathsDesc: 'A route to your goal',
    navMindmap: 'Knowledge maps', navMindmapDesc: 'Visual concept maps',
    navPlayground: 'Code playground', navPlaygroundDesc: '9 languages + AI tutor',
    navSubjects: 'Subjects', navSubjectsDesc: 'All learning areas',
    navAchievements: 'Achievements', navAchievementsDesc: 'Your awards',
  },
  hy: {
    tagline: 'սովորիր ամեն ինչ',
    navigation: 'Նավարկում',
    menu: 'Ընտրացանկ',
    theme: 'Փոխել թեման',
    language: 'Լեզու',
    search: 'Որոնում',
    account: 'Հաշիվ',
    days: 'օր',
    levelShort: 'մակ.',
    freeTitle: '100% անվճար',
    freeDescription: 'Առանց բաժանորդագրության և վճարովի գործառույթների։ Գիտելիքը պատկանում է բոլորին։',
    loadProfile: 'Բեռնում ենք քո պրոֆիլը...',
    loadDashboard: 'Բացում ենք վահանակը...',
    loadTutor: 'Միացնում ենք ուսուցչին...',
    loadLesson: 'Պատրաստում ենք դասը...',
    loadQuiz: 'Պատրաստում ենք հարցաշարը...',
    loadFlashcards: 'Պատրաստում ենք քարտերը...',
    loadMindmap: 'Կառուցում ենք գիտելիքի քարտեզը...',
    loadPlayground: 'Բացում ենք կոդի փորձադաշտը...',
    errorTitle: 'Ինչ-որ բան սխալ է',
    errorFallback: 'Չհաջողվեց բեռնել բաժինը',
    retry: 'Կրկին փորձել',
    footerFree: 'Անվճար։ Ընդմիշտ։',
    footerAbout: 'Նախագծի մասին',
    footerServices: 'Ծառայություններ',
    footerSubjects: 'Առարկաներ',
    footerCommunity: 'Համայնք',
    footerPrivacy: 'Գաղտնիություն',
    footerMade: 'Ստեղծված է',
    footerForKnowledge: 'գիտելիքի համար',
    footerCopyright: 'Գիտելիքը բոլորի ընդհանուր բարիքն է։',
    navHome: 'Գլխավոր', navHomeDesc: 'Մեկնարկային էջ',
    navDashboard: 'Վահանակ', navDashboardDesc: 'Քո առաջընթացը',
    navTutor: 'AI ուսուցիչ', navTutorDesc: 'Զրույց ուսուցչի հետ',
    navLessons: 'Դասեր', navLessonsDesc: 'Ինտերակտիվ դասեր',
    navQuiz: 'Հարցաշար', navQuizDesc: 'Ստուգիր գիտելիքներդ',
    navFlashcards: 'Քարտեր', navFlashcardsDesc: 'Պարբերական կրկնություն',
    navPaths: 'Ուսուցման ուղիներ', navPathsDesc: 'Ճանապարհ դեպի նպատակը',
    navMindmap: 'Գիտելիքի քարտեզներ', navMindmapDesc: 'Տեսողական հասկացությունների քարտեզներ',
    navPlayground: 'Կոդի փորձադաշտ', navPlaygroundDesc: '9 լեզու + AI ուսուցիչ',
    navSubjects: 'Առարկաներ', navSubjectsDesc: 'Բոլոր ոլորտները',
    navAchievements: 'Ձեռքբերումներ', navAchievementsDesc: 'Քո պարգևները',
  },
} as const

export type TranslationKey = keyof typeof translations.ru

export type LocalizedText = Record<Locale, string>

export const DATE_LOCALES: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  hy: 'hy-AM',
}

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

function persistLocale(locale: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.cookie = `info_oasis_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export const useLocale = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => {
    persistLocale(locale)
    set({ locale })
  },
}))

export function useLocaleSync() {
  const setLocale = useLocale((state) => state.setLocale)
  useEffect(() => {
    const cookies = document.cookie.split('; ')
    const cookieLocale = (
      cookies.find((item) => item.startsWith('info_oasis_locale=')) ??
      cookies.find((item) => item.startsWith('skilloasis_locale=')) ??
      cookies.find((item) => item.startsWith('lumina_locale='))
    )?.split('=')[1]
    const browserLocale = navigator.language.toLowerCase().split('-')[0]
    setLocale(isLocale(cookieLocale) ? cookieLocale : isLocale(browserLocale) ? browserLocale : DEFAULT_LOCALE)
  }, [setLocale])
}

export function useTranslations() {
  const locale = useLocale((state) => state.locale)
  const setLocale = useLocale((state) => state.setLocale)
  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale])
  const tr = useCallback(
    (ru: string, en: string, hy: string) => ({ ru, en, hy })[locale],
    [locale]
  )
  const localize = useCallback((value: LocalizedText) => value[locale], [locale])

  return {
    locale,
    locales: SUPPORTED_LOCALES,
    languageNames: LANGUAGE_NAMES,
    dateLocale: DATE_LOCALES[locale],
    setLocale,
    t,
    tr,
    localize,
  }
}
