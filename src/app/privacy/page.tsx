import { InformationPage } from '@/components/information-page'
import { PageJsonLd } from '@/components/seo-json-ld'
import { createPageMetadata, MARKETING_SEO } from '@/lib/seo'

const seo = MARKETING_SEO.privacy
export const metadata = createPageMetadata(seo)

export default function PrivacyPage() {
  return (
    <>
      <PageJsonLd page={seo} />
      <InformationPage
        eyebrow="Privacy"
        title="Your learning data should remain understandable and protected."
        description={seo.description}
        ctaLabel="Return to Info Oasis"
        sections={[
          { title: 'Information you provide', content: 'Account details may include your name, email address, profile image, and authentication provider when you choose to sign in.' },
          { title: 'Learning activity', content: 'Info Oasis may store progress, XP, streaks, lessons, quizzes, flashcards, and other activity needed to provide platform features.' },
          { title: 'Cookies and authentication', content: 'Essential cookies keep sessions secure, remember language preferences, and support reliable account authentication.' },
          { title: 'Service providers', content: 'Trusted infrastructure and AI providers process only the information required to deliver authentication, storage, hosting, and learning features.' },
          { title: 'Your choices', content: 'You can use core learning features as a guest or sign in to retain progress across sessions and devices.' },
          { title: 'Security', content: 'Info Oasis uses access controls and established platform providers to reduce unauthorized access to stored information.' },
        ]}
      />
    </>
  )
}
