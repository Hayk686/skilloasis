import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Info Oasis — Free AI Learning Platform',
    short_name: 'Info Oasis',
    description:
      'Learn any subject with a free AI tutor, interactive lessons, quizzes, flashcards, knowledge maps, and personalized learning paths.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07050f',
    theme_color: '#a855f7',
    orientation: 'any',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
