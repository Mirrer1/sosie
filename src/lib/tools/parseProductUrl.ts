import { tool } from 'ai'
import ogs from 'open-graph-scraper'

import { type ParseProductUrlOutput, parseProductUrlInputSchema } from '@/types/tool'

type OgImageObject = { url: string }
type OgInput = {
  ogTitle?: string
  ogImage?: OgImageObject[]
  ogDescription?: string
  ogSiteName?: string
}

// open-graph-scraper 결과를 Sosie 스키마로 매핑
export const mapOgResult = (result: OgInput, sourceUrl: string): ParseProductUrlOutput => {
  const imageUrl = result.ogImage?.[0]?.url

  return {
    title: result.ogTitle ?? '제목 없음',
    imageUrl,
    description: result.ogDescription,
    siteName: result.ogSiteName,
    sourceUrl,
  }
}

export const parseProductUrl = tool({
  description:
    '상품 페이지 URL에서 제목/이미지/설명 메타 정보를 추출합니다. 사용자가 무신사, 29CM, 공식몰 URL을 던지면서 "이거 정보 알려줘", "이거랑 비슷한 거" 같이 물을 때 호출하세요.',
  inputSchema: parseProductUrlInputSchema,
  execute: async ({ url }) => {
    const { result } = await ogs({ url })
    return mapOgResult(result, url)
  },
})
