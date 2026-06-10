import { tool } from 'ai'

import { type MarketProduct } from '@/types/product'
import {
  type SearchProductsInput,
  type SearchProductsOutput,
  searchProductsInputSchema,
} from '@/types/tool'

const NAVER_SHOP_API_URL = 'https://openapi.naver.com/v1/search/shop.json'
const DISPLAY_COUNT = 20
const RETURN_COUNT = 8

type NaverShopItem = {
  title: string
  link: string
  image: string
  lprice: string
  hprice: string
  mallName: string
  productId: string
  brand?: string
  category1?: string
  category2?: string
}

type NaverShopResponse = {
  total: number
  display: number
  items: NaverShopItem[]
}

// HTML 태그 제거
const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '')

// 네이버 응답 아이템을 MarketProduct로 매핑
export const mapNaverItem = (item: NaverShopItem): MarketProduct => ({
  id: item.productId,
  brand: item.brand?.trim() || item.mallName || '브랜드 미상',
  name: stripHtml(item.title),
  price: parseInt(item.lprice, 10),
  imageUrl: item.image,
  productUrl: item.link,
  mall: item.mallName || '판매처 미상',
})

// 검색 쿼리 조립, includeOtherMalls가 아니면 무신사 키워드 강제 첨부
export const buildQuery = ({
  keywords,
  brand,
  includeOtherMalls,
}: Pick<SearchProductsInput, 'keywords' | 'brand' | 'includeOtherMalls'>): string => {
  const parts: string[] = []
  if (!includeOtherMalls) parts.push('무신사')
  if (brand) parts.push(brand)
  parts.push(...keywords)
  return parts.join(' ')
}

// 무신사 입점 필터 (link 도메인이 musinsa.com인지)
export const isMusinsa = (item: { link?: string; mallName?: string }): boolean =>
  Boolean(item.link?.includes('musinsa.com')) || Boolean(item.mallName?.includes('무신사'))

// 가격 범위 필터
const matchesPrice = (product: MarketProduct, priceMin?: number, priceMax?: number): boolean => {
  if (priceMin !== undefined && product.price < priceMin) return false
  if (priceMax !== undefined && product.price > priceMax) return false
  return true
}

// 네이버 응답 -> SearchProductsOutput 변환
export const buildOutput = (
  response: NaverShopResponse,
  input: SearchProductsInput,
): SearchProductsOutput => {
  const filtered = response.items
    .filter((item) => (input.includeOtherMalls ? true : isMusinsa(item)))
    .map(mapNaverItem)
    .filter((p) => matchesPrice(p, input.priceMin, input.priceMax))
    .slice(0, RETURN_COUNT)

  return { products: filtered }
}

// 네이버 쇼핑 검색 API 호출
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

export const searchProducts = tool({
  description:
    '무신사에 입점된 상품을 키워드와 가격대로 검색합니다. 사용자가 옷, 신발, 가방 등 패션 아이템을 사고 싶다고 하면 호출하세요. 기본으로 무신사 입점 상품만 반환합니다.',
  inputSchema: searchProductsInputSchema,
  execute: async (input) => {
    const query = buildQuery(input)
    const response = await fetchNaverShop(query)
    return buildOutput(response, input)
  },
})
