import { tool } from 'ai'

import { type MarketProduct } from '@/types/product'
import {
  type SearchProductsInput,
  type SearchProductsOutput,
  searchProductsInputSchema,
} from '@/types/tool'

const NAVER_SHOP_API_URL = 'https://openapi.naver.com/v1/search/shop.json'
const DISPLAY_COUNT = 100
const RETURN_COUNT = 6
const POOL_COUNT = 18
const KEYWORD_SCORE = 3
const BRAND_SCORE = 4
const STYLE_SCORE = 2
const PRICE_BONUS = 2
const FASHION_CATEGORY = '패션'
const NOISE_KEYWORDS = ['중고', '리퍼', '렌탈', '대여', '도매', '사은품']

// 대화 프롬프트 상품명 단어로 매핑
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  청바지: ['데님'],
  맨투맨: ['스웨트셔츠', '스웨트'],
  후드티: ['후디'],
  후드: ['후디'],
  운동화: ['스니커즈'],
  바지: ['팬츠'],
  반바지: ['숏팬츠', '하프팬츠'],
  치마: ['스커트'],
  니트: ['스웨터'],
  가디건: ['카디건'],
  자켓: ['재킷'],
  재킷: ['자켓'],
}

// 스타일을 상품명에 실제로 등장하는 특징 단어로 변환
const STYLE_KEYWORDS: Record<string, string[]> = {
  캐주얼: ['스트레이트', '데일리', '베이직'],
  미니멀: ['베이직', '슬림', '솔리드', '미니멀'],
  스트릿: ['와이드', '오버핏', '카고', '벌룬', '워싱', '데미지'],
  빈티지: ['워싱', '워시드', '빈티지', '데미지', '페이드'],
  베이직: ['베이직', '스트레이트', '솔리드', '레귤러'],
  스포티: ['트랙', '져지', '조거', '나일론', '트레이닝'],
  포멀: ['슬랙스', '셋업', '테일러드', '드레스'],
  아메카지: ['치노', '코듀로이', '워크', '셀비지'],
}

// 공백 제거 + 소문자 정규화
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()

// 선호 스타일을 특징 단어 목록으로 펼침
export const styleHints = (styles?: string[]): string[] => {
  if (!styles) return []
  const result = new Set<string>()
  for (const style of styles) {
    const hints = STYLE_KEYWORDS[style.replace(/\s+/g, '')]
    if (hints) hints.forEach((h) => result.add(h))
  }
  return [...result]
}

// 상품이 선호 스타일의 특징 단어를 하나라도 가지면 true
export const matchesStyle = (
  product: { name: string; brand: string },
  styles?: string[],
): boolean => {
  const hints = styleHints(styles)
  if (hints.length === 0) return false
  const haystack = normalize(`${product.name} ${product.brand}`)
  return hints.some((hint) => haystack.includes(normalize(hint)))
}

// 앞쪽(상위)일수록 높은 가중치로 count개를 비복원 추출
const weightedSample = <T>(items: T[], count: number): T[] => {
  const pool = [...items]
  const picked: T[] = []
  while (picked.length < count && pool.length > 0) {
    const total = (pool.length * (pool.length + 1)) / 2
    let r = Math.random() * total
    let index = 0
    for (; index < pool.length - 1; index++) {
      const weight = pool.length - index
      if (r < weight) break
      r -= weight
    }
    picked.push(pool[index])
    pool.splice(index, 1)
  }
  return picked
}

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
  styleHint,
}: Pick<SearchProductsInput, 'keywords' | 'brand' | 'includeOtherMalls'> & {
  styleHint?: string
}): string => {
  const parts: string[] = []
  if (!includeOtherMalls) parts.push('무신사')
  if (brand) parts.push(brand)
  if (styleHint) parts.push(styleHint)
  parts.push(...keywords)
  return parts.join(' ')
}

// 결과가 없을 때 단계적으로 완화해 시도할 쿼리 목록 (구체 -> 광범위)
export const buildQueryVariants = (input: SearchProductsInput): string[] => {
  const variants: string[] = []
  const hint = styleHints(input.styles)[0]
  if (hint) variants.push(buildQuery({ ...input, styleHint: hint }))
  variants.push(buildQuery(input))
  if (input.brand) {
    variants.push(buildQuery({ ...input, brand: undefined }))
  }
  if (input.keywords.length > 1) {
    variants.push(
      buildQuery({ keywords: [input.keywords[0]], includeOtherMalls: input.includeOtherMalls }),
    )
  }
  return [...new Set(variants)]
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

// 검색 키워드에 같은말을 더해 매칭 폭을 넓힘
export const expandKeywords = (keywords: string[]): string[] => {
  const result = new Set<string>()
  for (const keyword of keywords) {
    result.add(keyword)
    const synonyms = KEYWORD_SYNONYMS[keyword.replace(/\s+/g, '')]
    if (synonyms) synonyms.forEach((s) => result.add(s))
  }
  return [...result]
}

// 키워드가 상품명·브랜드에 하나도 없으면 제외하고 동의어는 살림
export const matchesKeywords = (product: MarketProduct, keywords: string[]): boolean => {
  const haystack = normalize(`${product.name} ${product.brand}`)
  return keywords.some((keyword) => haystack.includes(normalize(keyword)))
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
  if (matchesStyle(product, input.styles)) score += STYLE_SCORE
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

  const expanded = { ...input, keywords: expandKeywords(input.keywords) }

  // 키워드 매칭이 하나라도 있으면 그것만, 전부 없으면 카테고리 결과를 그대로 사용
  const matched = candidates.filter((p) => matchesKeywords(p, expanded.keywords))
  const pool = matched.length > 0 ? matched : candidates

  const products = dedupeByName(pool)
    .map((product) => ({ product, score: scoreProduct(product, expanded) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, POOL_COUNT)
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
    '무신사에 입점된 상품을 키워드와 가격대로 검색합니다. 사용자가 옷, 신발, 가방 등 패션 아이템을 사고 싶다고 하면 호출하세요. 키워드에는 같은 뜻의 다른 표기(청바지/데님 등)를 함께 넣어 매칭률을 높이세요. 기본으로 무신사 입점 상품만 반환합니다.',
  inputSchema: searchProductsInputSchema,
  execute: async (input) => {
    const collected: MarketProduct[] = []
    const seen = new Set<string>()
    for (const query of buildQueryVariants(input)) {
      const response = await fetchNaverShop(query)
      const { products } = buildOutput(response, input)
      for (const product of products) {
        const key = normalize(product.name)
        if (seen.has(key)) continue
        seen.add(key)
        collected.push(product)
      }
      if (collected.length >= POOL_COUNT) break
    }
    // 스타일 맞는 상품을 먼저 채우고, 모자라면 나머지로 메꿈 (빈 결과 방지)
    const onStyle = collected.filter((p) => matchesStyle(p, input.styles))
    const offStyle = collected.filter((p) => !matchesStyle(p, input.styles))
    const picked = weightedSample(onStyle, RETURN_COUNT)
    if (picked.length < RETURN_COUNT) {
      picked.push(...weightedSample(offStyle, RETURN_COUNT - picked.length))
    }
    return { products: picked }
  },
})
