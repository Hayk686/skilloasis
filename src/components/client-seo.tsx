'use client'

import { useEffect } from 'react'
import { getSeoByPath, SITE_NAME, SITE_URL, SOCIAL_IMAGE_PATH, type PageSeo } from '@/lib/seo'
import { useNav } from '@/lib/store'

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export function ClientSeo({ page }: { page: PageSeo }) {
  useEffect(() => {
    const canonicalUrl = new URL(page.path, SITE_URL).toString()
    const socialImageUrl = new URL(SOCIAL_IMAGE_PATH, SITE_URL).toString()

    document.title = page.title
    setMeta('meta[name="description"]', 'name', 'description', page.description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', page.title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', page.description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME)
    setMeta('meta[property="og:image"]', 'property', 'og:image', socialImageUrl)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', page.title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', page.description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', socialImageUrl)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
  }, [page])

  useEffect(() => {
    const syncViewFromUrl = () => {
      const routePage = getSeoByPath(window.location.pathname)
      if (routePage) useNav.setState({ view: routePage.view })
    }
    window.addEventListener('popstate', syncViewFromUrl)
    return () => window.removeEventListener('popstate', syncViewFromUrl)
  }, [])

  return null
}
