import { InformationPage } from '@/components/information-page'
import { PageJsonLd } from '@/components/seo-json-ld'
import { createPageMetadata, MARKETING_SEO } from '@/lib/seo'

const seo = MARKETING_SEO.about
export const metadata = createPageMetadata(seo)

export default function AboutPage() {
  return (
    <>
      <PageJsonLd page={seo} />
      <InformationPage
        eyebrow="About Info Oasis"
        title="Learning should be clear, personal, and open to everyone."
        description={seo.description}
        sections={[
          {
            title: 'Our mission',
            content: 'Info Oasis turns curiosity into practical progress by making helpful learning tools available without subscriptions or artificial limits.',
          },
          {
            title: 'Built for understanding',
            content: 'Lessons, tutors, quizzes, maps, and practice tools focus on clear explanations and active learning instead of memorization alone.',
          },
          {
            title: 'Personal by design',
            content: 'Learners can choose a subject, level, language, and format, then move through material at a pace that fits their goal.',
          },
          {
            title: 'Knowledge for everyone',
            content: 'Info Oasis supports English, Russian, and Armenian and is designed to work across phones, tablets, and desktop computers.',
          },
        ]}
      />
    </>
  )
}
