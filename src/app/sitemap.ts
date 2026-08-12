import type { MetadataRoute } from 'next'
import { ALL_INDEXABLE_PAGES, SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ALL_INDEXABLE_PAGES.map((page) => ({
    url: new URL(page.path, SITE_URL).toString(),
    lastModified,
    changeFrequency: page.path === '/' ? 'weekly' : 'monthly',
    priority:
      page.path === '/'
        ? 1
        : page.path === '/ai-tutor' || page.path === '/lessons'
          ? 0.9
          : 0.8,
    images: [new URL('/opengraph-image', SITE_URL).toString()],
  }))
}
