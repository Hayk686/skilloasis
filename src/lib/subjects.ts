/**
 * Subjects catalogue — single source of truth for the explorer, paths and home.
 * Each subject has: id, ru/en labels, gradient, icon (lucide name), topics, level.
 */
export type SubjectLevel = "Новичок" | "Средний" | "Продвинутый" | "Любой"

export interface Subject {
  id: string
  ru: string
  en: string
  emoji: string
  icon: string // lucide icon name
  gradient: string // tailwind gradient classes
  accent: string // oklch-ish single color used for glows
  level: SubjectLevel
  description: string
  topics: string[]
}

export const SUBJECTS: Subject[] = [
  {
    id: "programming",
    ru: "Программирование",
    en: "Programming",
    emoji: "💻",
    icon: "Code2",
    gradient: "from-violet-500 via-fuchsia-500 to-pink-500",
    accent: "oklch(0.7 0.25 315)",
    level: "Любой",
    description: "От первых строк кода до архитектуры систем. Python, JS, алгоритмы, паттерны.",
    topics: ["Python с нуля", "JavaScript основы", "Алгоритмы и структуры", "React", "SQL", "Git"],
  },
  {
    id: "math",
    ru: "Математика",
    en: "Mathematics",
    emoji: "📐",
    icon: "Sigma",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    accent: "oklch(0.72 0.2 175)",
    level: "Любой",
    description: "Алгебра, геометрия, анализ, теория вероятностей — наглядно и по шагам.",
    topics: ["Линейная алгебра", "Матанализ", "Теория вероятностей", "Геометрия", "Комбинаторика"],
  },
  {
    id: "science",
    ru: "Естественные науки",
    en: "Science",
    emoji: "🔬",
    icon: "Atom",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    accent: "oklch(0.62 0.2 230)",
    level: "Любой",
    description: "Физика, химия, биология, астрономия — как устроен мир.",
    topics: ["Физика", "Химия", "Биология", "Астрономия", "Квантовая механика"],
  },
  {
    id: "languages",
    ru: "Языки",
    en: "Languages",
    emoji: "🌍",
    icon: "Languages",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    accent: "oklch(0.72 0.2 55)",
    level: "Любой",
    description: "Английский, испанский, японский и другие. Грамматика, лексика, практика.",
    topics: ["English", "Español", "日本語", "Deutsch", "Français"],
  },
  {
    id: "history",
    ru: "История",
    en: "History",
    emoji: "🏛️",
    icon: "Landmark",
    gradient: "from-rose-500 via-red-500 to-orange-500",
    accent: "oklch(0.68 0.26 15)",
    level: "Любой",
    description: "Древние цивилизации, войны, революции, культура. Уроки прошлого.",
    topics: ["Древний мир", "Средние века", "Новое время", "XX век", "История России"],
  },
  {
    id: "art",
    ru: "Искусство",
    en: "Art",
    emoji: "🎨",
    icon: "Palette",
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    accent: "oklch(0.7 0.25 0)",
    level: "Любой",
    description: "Живопись, музыка, литература, кино. Стиль, композиция, история.",
    topics: ["Живопись", "Музыка", "Литература", "Кино", "Дизайн"],
  },
  {
    id: "business",
    ru: "Бизнес и финансы",
    en: "Business",
    emoji: "📈",
    icon: "TrendingUp",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    accent: "oklch(0.7 0.18 150)",
    level: "Любой",
    description: "Менеджмент, маркетинг, инвестиции, экономика, стартапы.",
    topics: ["Менеджмент", "Маркетинг", "Инвестиции", "Экономика", "Стартапы"],
  },
  {
    id: "philosophy",
    ru: "Философия",
    en: "Philosophy",
    emoji: "💭",
    icon: "Brain",
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    accent: "oklch(0.65 0.22 290)",
    level: "Любой",
    description: "Этика, логика, метафизика. Великие мыслители и большие вопросы.",
    topics: ["Этика", "Логика", "Метафизика", "Стоицизм", "Экзистенциализм"],
  },
]

export const SUBJECT_MAP: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s])
)

export function getSubject(id: string): Subject | undefined {
  return SUBJECT_MAP[id]
}
