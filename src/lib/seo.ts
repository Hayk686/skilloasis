import type { Metadata } from 'next'
import type { ViewId } from '@/lib/store'

export const SITE_NAME = 'Info Oasis'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skilloasis-phi.vercel.app'
export const SOCIAL_IMAGE_PATH = '/opengraph-image'
export const SOCIAL_IMAGE_ALT = 'Info Oasis — learn anything with a smart AI tutor'

export interface SeoPage {
  path: string
  title: string
  description: string
  keywords: string[]
}

export interface PageSeo extends SeoPage {
  view: ViewId
}

export const VIEW_SEO: Record<ViewId, PageSeo> = {
  home: {
    view: 'home',
    path: '/',
    title: 'Info Oasis | Free AI Learning Platform',
    description:
      'Learn any subject with a free AI tutor, interactive lessons, adaptive quizzes, flashcards, knowledge maps, and personalized learning paths.',
    keywords: ['free AI learning platform', 'AI tutor', 'online learning', 'Info Oasis'],
  },
  dashboard: {
    view: 'dashboard',
    path: '/dashboard',
    title: 'Learning Dashboard | Info Oasis',
    description:
      'Track your learning streak, XP, completed lessons, quiz results, achievements, and progress across every subject in one clear dashboard.',
    keywords: ['learning dashboard', 'study progress tracker', 'learning analytics'],
  },
  tutor: {
    view: 'tutor',
    path: '/ai-tutor',
    title: 'Free AI Tutor for Any Subject | Info Oasis',
    description:
      'Ask questions and get clear, step-by-step explanations from a free AI tutor across programming, mathematics, science, languages, and more.',
    keywords: ['free AI tutor', 'AI homework help', 'step-by-step explanations'],
  },
  lessons: {
    view: 'lessons',
    path: '/lessons',
    title: 'Interactive AI Lessons | Info Oasis',
    description:
      'Create personalized, interactive lessons on any topic and learn at your own pace with clear explanations, examples, and practical exercises.',
    keywords: ['interactive lessons', 'AI lessons', 'personalized learning'],
  },
  quiz: {
    view: 'quiz',
    path: '/quiz',
    title: 'Adaptive AI Quizzes | Info Oasis',
    description:
      'Generate adaptive quizzes for any subject, test your knowledge, review explanations, and improve with instant feedback and progress tracking.',
    keywords: ['AI quiz generator', 'adaptive quizzes', 'online knowledge test'],
  },
  flashcards: {
    view: 'flashcards',
    path: '/flashcards',
    title: 'AI Flashcards for Better Recall | Info Oasis',
    description:
      'Create AI-powered flashcards for any topic and remember more with focused review, spaced repetition, and simple progress tracking.',
    keywords: ['AI flashcards', 'spaced repetition', 'study cards'],
  },
  paths: {
    view: 'paths',
    path: '/learning-paths',
    title: 'Personalized Learning Paths | Info Oasis',
    description:
      'Turn any learning goal into a clear, personalized roadmap with practical milestones, recommended topics, and progress you can follow.',
    keywords: ['personalized learning path', 'study roadmap', 'learning plan'],
  },
  subjects: {
    view: 'subjects',
    path: '/subjects',
    title: 'Explore Learning Subjects | Info Oasis',
    description:
      'Explore programming, mathematics, science, languages, history, art, business, philosophy, and more with free AI-powered learning tools.',
    keywords: ['online subjects', 'learn programming', 'learn mathematics', 'free courses'],
  },
  achievements: {
    view: 'achievements',
    path: '/achievements',
    title: 'Learning Achievements & XP | Info Oasis',
    description:
      'Stay motivated with learning achievements, XP, streaks, milestones, and rewards that celebrate your progress across Info Oasis.',
    keywords: ['learning achievements', 'study streak', 'education gamification'],
  },
  mindmap: {
    view: 'mindmap',
    path: '/knowledge-maps',
    title: 'AI Knowledge Maps | Info Oasis',
    description:
      'Turn complex topics into visual AI knowledge maps that reveal key concepts, relationships, and a clearer path to understanding.',
    keywords: ['AI knowledge map', 'concept map generator', 'visual learning'],
  },
  playground: {
    view: 'playground',
    path: '/code-playground',
    title: 'Online Code Playground & AI Tutor | Info Oasis',
    description:
      'Write, run, and practice code in nine programming languages with warm-up exercises, instant output, and helpful AI guidance.',
    keywords: ['online code playground', 'learn coding', 'AI coding tutor', 'run code online'],
  },
}

export const INDEXABLE_PAGES = Object.values(VIEW_SEO)

export const MARKETING_SEO = {
  about: {
    path: '/about',
    title: 'About Info Oasis | Learning for Everyone',
    description:
      'Discover how Info Oasis makes high-quality learning accessible through free AI tutoring, interactive practice, and personalized study tools.',
    keywords: ['about Info Oasis', 'accessible education', 'AI learning mission'],
  },
  services: {
    path: '/services',
    title: 'AI Learning Tools & Services | Info Oasis',
    description:
      'Explore free AI tutoring, interactive lessons, adaptive quizzes, flashcards, learning paths, knowledge maps, and coding practice.',
    keywords: ['AI learning services', 'education tools', 'free study tools'],
  },
  community: {
    path: '/community',
    title: 'Info Oasis Learning Community',
    description:
      'Join a learning community built around curiosity, steady progress, shared knowledge, and accessible education for everyone.',
    keywords: ['learning community', 'Info Oasis community', 'shared knowledge'],
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy | Info Oasis',
    description:
      'Learn how Info Oasis handles account information, learning activity, cookies, authentication, and data protection across the platform.',
    keywords: ['Info Oasis privacy', 'privacy policy', 'learning data protection'],
  },
} satisfies Record<string, SeoPage>

export const ALL_INDEXABLE_PAGES: SeoPage[] = [
  ...INDEXABLE_PAGES,
  ...Object.values(MARKETING_SEO),
]

export function getSeoBySlug(slug: string): PageSeo | undefined {
  return INDEXABLE_PAGES.find((page) => page.path === `/${slug}`)
}

export function getSeoByPath(pathname: string): PageSeo | undefined {
  const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname
  return INDEXABLE_PAGES.find((page) => page.path === normalized)
}

export function getPathForView(view: ViewId): string {
  return VIEW_SEO[view].path
}

export function createPageMetadata(page: SeoPage): Metadata {
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
      url: page.path,
      locale: 'en_US',
      alternateLocale: ['ru_RU', 'hy_AM'],
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [SOCIAL_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  }
}

export function pageJsonLd(page: SeoPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: new URL(page.path, SITE_URL).toString(),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}
