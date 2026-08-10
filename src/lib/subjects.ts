/**
 * Subjects catalogue — single source of truth for the explorer, paths and home.
 * Each subject has: id, ru/en labels, gradient, icon (lucide name), topics, level.
 */
import type { Locale } from '@/lib/i18n-config'

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

interface SubjectTranslation {
  name: string
  description: string
  topics: string[]
}

const SUBJECT_TRANSLATIONS: Record<string, Record<'en' | 'hy', SubjectTranslation>> = {
  programming: {
    en: { name: 'Programming', description: 'From your first lines of code to system architecture. Python, JavaScript, algorithms, and patterns.', topics: ['Python from scratch', 'JavaScript basics', 'Algorithms and data structures', 'React', 'SQL', 'Git'] },
    hy: { name: 'Ծրագրավորում', description: 'Կոդի առաջին տողերից մինչև համակարգերի ճարտարապետություն։ Python, JavaScript, ալգորիթմներ և ձևանմուշներ։', topics: ['Python զրոյից', 'JavaScript-ի հիմունքներ', 'Ալգորիթմներ և տվյալների կառուցվածքներ', 'React', 'SQL', 'Git'] },
  },
  math: {
    en: { name: 'Mathematics', description: 'Algebra, geometry, calculus, and probability explained visually and step by step.', topics: ['Linear algebra', 'Calculus', 'Probability theory', 'Geometry', 'Combinatorics'] },
    hy: { name: 'Մաթեմատիկա', description: 'Հանրահաշիվ, երկրաչափություն, անալիզ և հավանականությունների տեսություն՝ տեսողական ու քայլ առ քայլ։', topics: ['Գծային հանրահաշիվ', 'Մաթեմատիկական անալիզ', 'Հավանականությունների տեսություն', 'Երկրաչափություն', 'Կոմբինատորիկա'] },
  },
  science: {
    en: { name: 'Natural sciences', description: 'Physics, chemistry, biology, and astronomy—discover how the world works.', topics: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Quantum mechanics'] },
    hy: { name: 'Բնական գիտություններ', description: 'Ֆիզիկա, քիմիա, կենսաբանություն և աստղագիտություն՝ բացահայտիր, թե ինչպես է կառուցված աշխարհը։', topics: ['Ֆիզիկա', 'Քիմիա', 'Կենսաբանություն', 'Աստղագիտություն', 'Քվանտային մեխանիկա'] },
  },
  languages: {
    en: { name: 'Languages', description: 'English, Spanish, Japanese, and more. Grammar, vocabulary, and practice.', topics: ['English', 'Spanish', 'Japanese', 'German', 'French'] },
    hy: { name: 'Լեզուներ', description: 'Անգլերեն, իսպաներեն, ճապոներեն և այլ լեզուներ։ Քերականություն, բառապաշար և գործնական վարժություններ։', topics: ['Անգլերեն', 'Իսպաներեն', 'Ճապոներեն', 'Գերմաներեն', 'Ֆրանսերեն'] },
  },
  history: {
    en: { name: 'History', description: 'Ancient civilizations, wars, revolutions, and culture. Lessons from the past.', topics: ['Ancient world', 'Middle Ages', 'Modern era', '20th century', 'History of Russia'] },
    hy: { name: 'Պատմություն', description: 'Հին քաղաքակրթություններ, պատերազմներ, հեղափոխություններ և մշակույթ։ Դասեր անցյալից։', topics: ['Հին աշխարհ', 'Միջնադար', 'Նոր ժամանակներ', '20-րդ դար', 'Ռուսաստանի պատմություն'] },
  },
  art: {
    en: { name: 'Art', description: 'Painting, music, literature, and film. Style, composition, and history.', topics: ['Painting', 'Music', 'Literature', 'Film', 'Design'] },
    hy: { name: 'Արվեստ', description: 'Գեղանկարչություն, երաժշտություն, գրականություն և կինո։ Ոճ, կոմպոզիցիա և պատմություն։', topics: ['Գեղանկարչություն', 'Երաժշտություն', 'Գրականություն', 'Կինո', 'Դիզայն'] },
  },
  business: {
    en: { name: 'Business and finance', description: 'Management, marketing, investing, economics, and startups.', topics: ['Management', 'Marketing', 'Investing', 'Economics', 'Startups'] },
    hy: { name: 'Բիզնես և ֆինանսներ', description: 'Կառավարում, մարքեթինգ, ներդրումներ, տնտեսագիտություն և ստարտափներ։', topics: ['Կառավարում', 'Մարքեթինգ', 'Ներդրումներ', 'Տնտեսագիտություն', 'Ստարտափներ'] },
  },
  philosophy: {
    en: { name: 'Philosophy', description: 'Ethics, logic, and metaphysics. Great thinkers and big questions.', topics: ['Ethics', 'Logic', 'Metaphysics', 'Stoicism', 'Existentialism'] },
    hy: { name: 'Փիլիսոփայություն', description: 'Էթիկա, տրամաբանություն և մետաֆիզիկա։ Մեծ մտածողներ և մեծ հարցեր։', topics: ['Էթիկա', 'Տրամաբանություն', 'Մետաֆիզիկա', 'Ստոիցիզմ', 'Էքզիստենցիալիզմ'] },
  },
}

export function localizeSubject(subject: Subject, locale: Locale): SubjectTranslation {
  if (locale === 'ru') {
    return { name: subject.ru, description: subject.description, topics: subject.topics }
  }
  return SUBJECT_TRANSLATIONS[subject.id]?.[locale] ?? {
    name: locale === 'en' ? subject.en : subject.ru,
    description: subject.description,
    topics: subject.topics,
  }
}

export function localizeSubjectLevel(level: SubjectLevel, locale: Locale): string {
  const labels: Record<SubjectLevel, Record<Locale, string>> = {
    'Новичок': { ru: 'Новичок', en: 'Beginner', hy: 'Սկսնակ' },
    'Средний': { ru: 'Средний', en: 'Intermediate', hy: 'Միջին' },
    'Продвинутый': { ru: 'Продвинутый', en: 'Advanced', hy: 'Առաջադեմ' },
    'Любой': { ru: 'Любой', en: 'Any level', hy: 'Ցանկացած մակարդակ' },
  }
  return labels[level][locale]
}

export const SUBJECT_MAP: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s])
)

export function getSubject(id: string): Subject | undefined {
  return SUBJECT_MAP[id]
}
