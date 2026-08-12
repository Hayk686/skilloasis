import { InformationPage } from '@/components/information-page'
import { PageJsonLd } from '@/components/seo-json-ld'
import { createPageMetadata, MARKETING_SEO } from '@/lib/seo'

const seo = MARKETING_SEO.community
export const metadata = createPageMetadata(seo)

export default function CommunityPage() {
  return (
    <>
      <PageJsonLd page={seo} />
      <InformationPage
        eyebrow="Community"
        title="Curiosity grows when knowledge is shared."
        description={seo.description}
        sections={[
          { title: 'Learn openly', content: 'Explore subjects without gatekeeping and use the tools that match how you learn best.' },
          { title: 'Build momentum', content: 'Streaks, XP, achievements, and visible progress make consistent learning easier to maintain.' },
          { title: 'Share progress', content: 'Celebrate milestones and encourage other learners by sharing what you have accomplished.' },
          { title: 'Shape what comes next', content: 'The community helps Info Oasis improve by identifying useful subjects, tools, and learning experiences.' },
        ]}
      />
    </>
  )
}
