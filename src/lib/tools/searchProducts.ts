import { tool } from 'ai'

import { type MarketProduct } from '@/types/product'
import {
  type SearchProductsInput,
  type SearchProductsOutput,
  searchProductsInputSchema,
} from '@/types/tool'

const NAVER_SHOP_API_URL = 'https://openapi.naver.com/v1/search/shop.json'
const DISPLAY_COUNT = 20
const RETURN_COUNT = 6
const KEYWORD_SCORE = 3
const BRAND_SCORE = 4
const PRICE_BONUS = 2
const FASHION_CATEGORY = '패션'
const NOISE_KEYWORDS = ['중고', '리퍼', '렌탈', '대여', '도매', '사은품']

// 공백 제거 + 소문자 정규화
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()

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

// 무신사 입점 필터
export const isMusinsa = (item: { link?: string; mallName?: string }): boolean =>
  Boolean(item.link?.includes('musinsa.com')) || Boolean(item.mallName?.includes('무신사'))

// 패션 외 카테고리와 중고/도매 등 노이즈 아이템 제외
export const isRelevantItem = (item: { title?: string; category1?: string }): boolean => {
  const name = stripHtml(item.title ?? '')
  if (NOISE_KEYWORDS.some((keyword) => name.includes(keyword))) return false
  if (item.category1 && !item.category1.includes(FASHION_CATEGORY)) return false
  return true
}

// 가격 범위 필터
const matchesPrice = (product: MarketProduct, priceMin?: number, priceMax?: number): boolean => {
  if (priceMin !== undefined && product.price < priceMin) return false
  if (priceMax !== undefined && product.price > priceMax) return false
  return true
}

// 상품명 정규화 기준 중복 제거, 몰만 다른 동일 상품은 1개만 남김
export const dedupeByName = (products: MarketProduct[]): MarketProduct[] => {
  const seen = new Set<string>()
  const result: MarketProduct[] = []
  for (const product of products) {
    const key = normalize(product.name)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(product)
  }
  return result
}

// 입력 적합도 점수, 키워드·브랜드 일치와 예산 근접도를 합산
export const scoreProduct = (product: MarketProduct, input: SearchProductsInput): number => {
  const haystack = normalize(`${product.name} ${product.brand}`)
  let score = 0
  for (const keyword of input.keywords) {
    if (haystack.includes(normalize(keyword))) score += KEYWORD_SCORE
  }
  if (input.brand && haystack.includes(normalize(input.brand))) score += BRAND_SCORE
  if (input.priceMin !== undefined && input.priceMax !== undefined) {
    const center = (input.priceMin + input.priceMax) / 2
    const half = (input.priceMax - input.priceMin) / 2
    if (half > 0) {
      const closeness = 1 - Math.abs(product.price - center) / half
      score += Math.max(0, closeness) * PRICE_BONUS
    }
  }
  return score
}

// 네이버 응답 -> SearchProductsOutput 변환
export const buildOutput = (
  response: NaverShopResponse,
  input: SearchProductsInput,
): SearchProductsOutput => {
  const candidates = response.items
    .filter((item) => (input.includeOtherMalls ? true : isMusinsa(item)))
    .filter(isRelevantItem)
    .map(mapNaverItem)
    .filter((p) => matchesPrice(p, input.priceMin, input.priceMax))

  const products = dedupeByName(candidates)
    .map((product) => ({ product, score: scoreProduct(product, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, RETURN_COUNT)
    .map((entry) => entry.product)

  return { products }
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
