import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import InfoOasisApp from '@/app/page'
import { createPageMetadata, getSeoBySlug, INDEXABLE_PAGES } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return INDEXABLE_PAGES.filter((page) => page.path !== '/').map((page) => ({
    view: page.path.slice(1),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ view: string }>
}): Promise<Metadata> {
  const { view } = await params
  const page = getSeoBySlug(view)
  if (!page) return {}
  return createPageMetadata(page)
}

export default async function ViewPage({
  params,
}: {
  params: Promise<{ view: string }>
}) {
  const { view } = await params
  const page = getSeoBySlug(view)
  if (!page) notFound()
  return <InfoOasisApp initialView={page.view} />
}
