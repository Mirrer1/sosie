import { tool } from 'ai'

import { type ComparePricesOutput, comparePricesInputSchema } from '@/types/tool'

const NAVER_SHOP_API_URL = 'https://openapi.naver.com/v1/search/shop.json'
const DISPLAY_COUNT = 5

type NaverShopItem = {
  title: string
  link: string
  image: string
  lprice: string
  hprice: string
  mallName: string
  productId: string
  brand?: string
}

type NaverShopResponse = {
  total: number
  display: number
  items: NaverShopItem[]
}

// HTML 태그 제거
const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '')

// 네이버 응답을 Sosie 스키마로 매핑
export const mapNaverResponse = (data: NaverShopResponse): ComparePricesOutput => {
  return {
    sources: data.items.map((item) => ({
      seller: item.mallName || '알 수 없음',
      price: parseInt(item.lprice, 10),
      url: item.link,
      imageUrl: item.image || undefined,
      title: stripHtml(item.title),
    })),
  }
}

// 네이버 쇼핑 API 호출
const fetchNaverShop = async (query: string): Promise<NaverShopResponse> => {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('네이버 API 키가 설정되지 않았습니다.')
  }

  const url = new URL(NAVER_SHOP_API_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('display', String(DISPLAY_COUNT))
  url.searchParams.set('sort', 'sim')

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  })

  if (!res.ok) {
    throw new Error(`네이버 API 오류: ${res.status}`)
  }

  return res.json()
}

export const comparePrices = tool({
  description:
    '같은 상품을 여러 판매처에서 가격 비교합니다. 사용자가 가격, 어디서 사는 게 싼지, 판매처 비교를 물을 때 호출하세요.',
  inputSchema: comparePricesInputSchema,
  execute: async ({ productName }) => {
    const data = await fetchNaverShop(productName)
    return mapNaverResponse(data)
  },
})
