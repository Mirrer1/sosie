import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sosie-theta.vercel.app'

// 사이트맵 설정
const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: SITE_URL,
    changeFrequency: 'monthly',
    priority: 1,
  },
]

export default sitemap
