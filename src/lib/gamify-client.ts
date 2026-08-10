/** Client-safe gamification constants & pure helpers (no server imports). */
import type { Locale } from '@/lib/i18n-config'

/** XP needed to reach a given level (cumulative). */
export function xpForLevel(level: number): number {
  // smooth curve: 100, 250, 450, 700, 1000...
  return Math.round(50 * level * (level + 1))
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  return level
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  const cur = level <= 1 ? 0 : xpForLevel(level)
  const next = xpForLevel(level + 1)
  const into = xp - cur
  const span = next - cur
  return {
    level,
    into,
    span,
    pct: span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0,
    next,
  }
}

export const ACHIEVEMENTS = [
  { type: 'first_lesson', title: 'Первый шаг', emoji: '👣', desc: 'Заверши первый урок' },
  { type: 'first_quiz', title: 'Знаток', emoji: '🧠', desc: 'Пройди первый квиз' },
  { type: 'first_chat', title: 'Любопытство', emoji: '💬', desc: 'Задай первый вопрос наставнику' },
  { type: 'first_flashcard', title: 'Карточный мастер', emoji: '🃏', desc: 'Создай первую флешкарту' },
  { type: 'first_audio', title: 'Слушатель', emoji: '🎧', desc: 'Включи аудио-озвучку урока' },
  { type: 'first_mindmap', title: 'Картограф', emoji: '🗺️', desc: 'Создай первую карту знаний' },
  { type: 'first_code', title: 'Кодер', emoji: '💻', desc: 'Запусти код в песочнице и получи AI-подсказку' },
  { type: 'first_share', title: 'Достигатор', emoji: '🌟', desc: 'Сгенерируй карточку прогресса с AI-артом' },
  { type: 'streak_3', title: 'В ритме', emoji: '🔥', desc: '3 дня подряд' },
  { type: 'streak_7', title: 'Неделя силы', emoji: '⚡', desc: '7 дней подряд' },
  { type: 'level_5', title: 'Поднимаемся', emoji: '🚀', desc: 'Достигни 5 уровня' },
  { type: 'xp_1000', title: 'Тысячник', emoji: '💎', desc: 'Накопи 1000 XP' },
  { type: 'polyglot', title: 'Полиглот', emoji: '🌍', desc: 'Изучай 3+ разных предмета' },
  { type: 'quiz_perfect', title: 'Идеал', emoji: '🏆', desc: 'Ответь на все вопросы квиза верно' },
] as const

export type AchievementType = (typeof ACHIEVEMENTS)[number]['type']

const ACHIEVEMENT_TRANSLATIONS: Record<AchievementType, Record<'en' | 'hy', { title: string; desc: string }>> = {
  first_lesson: { en: { title: 'First step', desc: 'Complete your first lesson' }, hy: { title: 'Առաջին քայլ', desc: 'Ավարտիր առաջին դասը' } },
  first_quiz: { en: { title: 'Knowledge seeker', desc: 'Complete your first quiz' }, hy: { title: 'Գիտակ', desc: 'Ավարտիր առաջին հարցաշարը' } },
  first_chat: { en: { title: 'Curiosity', desc: 'Ask the tutor your first question' }, hy: { title: 'Հետաքրքրասիրություն', desc: 'Տուր առաջին հարցը ուսուցչին' } },
  first_flashcard: { en: { title: 'Card master', desc: 'Create your first flashcard' }, hy: { title: 'Քարտերի վարպետ', desc: 'Ստեղծիր առաջին ուսուցման քարտը' } },
  first_audio: { en: { title: 'Listener', desc: 'Play your first audio lesson' }, hy: { title: 'Ունկնդիր', desc: 'Միացրու դասի առաջին աուդիոն' } },
  first_mindmap: { en: { title: 'Cartographer', desc: 'Create your first knowledge map' }, hy: { title: 'Քարտեզագիր', desc: 'Ստեղծիր առաջին գիտելիքի քարտեզը' } },
  first_code: { en: { title: 'Coder', desc: 'Run code and receive an AI hint' }, hy: { title: 'Ծրագրավորող', desc: 'Գործարկիր կոդը և ստացիր AI հուշում' } },
  first_share: { en: { title: 'Achiever', desc: 'Generate a progress card with AI art' }, hy: { title: 'Նվաճող', desc: 'Ստեղծիր առաջընթացի քարտ AI պատկերով' } },
  streak_3: { en: { title: 'In the rhythm', desc: 'Learn for three days in a row' }, hy: { title: 'Ռիթմի մեջ', desc: 'Սովորիր երեք օր անընդմեջ' } },
  streak_7: { en: { title: 'Power week', desc: 'Learn for seven days in a row' }, hy: { title: 'Ուժի շաբաթ', desc: 'Սովորիր յոթ օր անընդմեջ' } },
  level_5: { en: { title: 'Moving up', desc: 'Reach level five' }, hy: { title: 'Վերելք', desc: 'Հասիր հինգերորդ մակարդակին' } },
  xp_1000: { en: { title: 'One thousand', desc: 'Earn 1,000 XP' }, hy: { title: 'Հազարավոր', desc: 'Հավաքիր 1000 XP' } },
  polyglot: { en: { title: 'Polyglot', desc: 'Study three or more subjects' }, hy: { title: 'Բազմալեզու', desc: 'Ուսումնասիրիր երեք կամ ավելի առարկա' } },
  quiz_perfect: { en: { title: 'Perfect score', desc: 'Answer every quiz question correctly' }, hy: { title: 'Կատարյալ արդյունք', desc: 'Ճիշտ պատասխանիր հարցաշարի բոլոր հարցերին' } },
}

export function localizeAchievement(
  achievement: (typeof ACHIEVEMENTS)[number],
  locale: Locale
): { title: string; desc: string } {
  if (locale === 'ru') return { title: achievement.title, desc: achievement.desc }
  return ACHIEVEMENT_TRANSLATIONS[achievement.type][locale]
}
