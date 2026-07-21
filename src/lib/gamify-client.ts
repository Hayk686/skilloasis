/** Client-safe gamification constants & pure helpers (no server imports). */

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
