import type { SeoPage } from '@/lib/seo'
import { pageJsonLd } from '@/lib/seo'

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function PageJsonLd({ page }: { page: SeoPage }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd(page)) }}
    />
  )
}
