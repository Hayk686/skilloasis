import { InformationPage } from '@/components/information-page'
import { PageJsonLd } from '@/components/seo-json-ld'
import { createPageMetadata, MARKETING_SEO } from '@/lib/seo'

const seo = MARKETING_SEO.services
export const metadata = createPageMetadata(seo)

export default function ServicesPage() {
  return (
    <>
      <PageJsonLd page={seo} />
      <InformationPage
        eyebrow="Learning services"
        title="Every tool you need to move from question to mastery."
        description={seo.description}
        ctaLabel="Explore subjects"
        ctaHref="/subjects"
        sections={[
          { title: 'AI tutor', content: 'Ask questions in natural language and receive structured, step-by-step explanations tailored to the subject.' },
          { title: 'Interactive lessons', content: 'Generate focused lessons with examples, key ideas, and exercises for the level you choose.' },
          { title: 'Practice and recall', content: 'Use adaptive quizzes and spaced-repetition flashcards to test understanding and remember more.' },
          { title: 'Learning paths', content: 'Break a large goal into practical milestones and follow a clear roadmap from beginner to confident learner.' },
          { title: 'Knowledge maps', content: 'Visualize relationships between concepts so complex topics become easier to explore and understand.' },
          { title: 'Code playground', content: 'Practice nine programming languages with runnable examples, warm-up exercises, and AI guidance.' },
        ]}
      />
    </>
  )
}
