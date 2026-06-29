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
const FAVORITE_BRAND_SCORE = 3
const PRICE_BONUS = 2
const MAX_PER_BRAND = 2
const FASHION_CATEGORY = '패션'
const NOISE_KEYWORDS = ['중고', '리퍼', '렌탈', '대여', '도매', '사은품']

// 사용자가 말한 단어를 상품명 표기로 매핑
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  청바지: ['데님'],
  바지: ['팬츠'],
  반바지: ['숏팬츠', '하프팬츠'],
  정장바지: ['슬랙스'],
  조거: ['조거팬츠'],
  카고: ['카고팬츠'],
  치마: ['스커트'],
  맨투맨: ['스웨트셔츠', '스웨트'],
  후드티: ['후디'],
  후드: ['후디'],
  반팔: ['반팔티', '티셔츠'],
  셔츠: ['남방'],
  남방: ['셔츠'],
  와이셔츠: ['셔츠'],
  니트: ['스웨터'],
  가디건: ['카디건'],
  조끼: ['베스트'],
  자켓: ['재킷'],
  재킷: ['자켓'],
  잠바: ['점퍼', '재킷'],
  점퍼: ['블루종'],
  패딩: ['다운', '구스다운'],
  원피스: ['드레스'],
  목도리: ['머플러', '스카프'],
  운동화: ['스니커즈'],
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

// 상품이 선호 스타일의 특징 단어를 하나라도 가지는지 여부
export const matchesStyle = (
  product: { name: string; brand: string },
  styles?: string[],
): boolean => {
  const hints = styleHints(styles)
  if (hints.length === 0) return false
  const haystack = normalize(`${product.name} ${product.brand}`)
  return hints.some((hint) => haystack.includes(normalize(hint)))
}

// 앞쪽(상위)일수록 높은 가중치로 인덱스 하나 추출
const weightedPickIndex = (length: number): number => {
  const total = (length * (length + 1)) / 2
  let r = Math.random() * total
  let index = 0
  for (; index < length - 1; index++) {
    const weight = length - index
    if (r < weight) break
    r -= weight
  }
  return index
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

// 상품명 앞 대괄호에서 브랜드 추출
const extractBrandFromTitle = (title: string): string | undefined => {
  const matched = stripHtml(title).match(/^\s*\[([^\]]+)\]/)
  return matched ? matched[1].trim() : undefined
}

// 상품명 앞 대괄호 제거, 브랜드는 따로 표시
const stripLeadingBrand = (title: string): string => {
  const cleaned = stripHtml(title)
  return cleaned.replace(/^\s*\[[^\]]*\]\s*/, '').trim() || cleaned
}

// 네이버 응답 아이템을 MarketProduct로 매핑
export const mapNaverItem = (item: NaverShopItem): MarketProduct => ({
  id: item.productId,
  brand: item.brand?.trim() || extractBrandFromTitle(item.title) || item.mallName || '브랜드 미상',
  name: stripLeadingBrand(item.title),
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

// 검색 키워드에 같은 말을 더해 매칭 폭을 넓힘
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
export const scoreProduct = (
  product: MarketProduct,
  input: SearchProductsInput,
  favoriteBrands?: string[],
): number => {
  const haystack = normalize(`${product.name} ${product.brand}`)
  let score = 0
  for (const keyword of input.keywords) {
    if (haystack.includes(normalize(keyword))) score += KEYWORD_SCORE
  }
  if (input.brand && haystack.includes(normalize(input.brand))) score += BRAND_SCORE
  if (matchesStyle(product, input.styles)) score += STYLE_SCORE
  if (favoriteBrands?.some((brand) => haystack.includes(normalize(brand)))) {
    score += FAVORITE_BRAND_SCORE
  }
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
  favoriteBrands?: string[],
): SearchProductsOutput => {
  const base = response.items
    .filter((item) => (input.includeOtherMalls ? true : isMusinsa(item)))
    .filter(isRelevantItem)
    .map(mapNaverItem)

  // 예산 필터, 예산 내가 너무 적으면 예산 밖도 포함 (점수의 예산 근접도로 예산 내가 우선)
  const priced = base.filter((p) => matchesPrice(p, input.priceMin, input.priceMax))
  const candidates = priced.length >= RETURN_COUNT ? priced : base

  const expanded = { ...input, keywords: expandKeywords(input.keywords) }

  // 키워드 매칭이 하나라도 있으면 그것만, 전부 없으면 카테고리 결과를 그대로 사용
  const matched = candidates.filter((p) => matchesKeywords(p, expanded.keywords))
  const pool = matched.length > 0 ? matched : candidates

  const products = dedupeByName(pool)
    .map((product) => ({ product, score: scoreProduct(product, expanded, favoriteBrands) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, POOL_COUNT)
    .map((entry) => entry.product)

  return { products }
}

// 네이버 쇼핑 검색 API 호출, 일시 실패 시 1회 재시도
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
  const headers = {
    'X-Naver-Client-Id': clientId,
    'X-Naver-Client-Secret': clientSecret,
  }

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers })
      if (res.ok) return await res.json()
      lastError = new Error(`네이버 API 오류: ${res.status}`)
    } catch (error) {
      lastError = error
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw lastError
}

// 자주 찜한 브랜드를 랭킹에 반영하는 searchProducts 인스턴스 생성
export const createSearchProducts = (favoriteBrands?: string[]) =>
  tool({
    description:
      '무신사에 입점된 상품을 키워드와 가격대로 검색합니다. 사용자가 옷, 신발, 가방 등 패션 아이템을 사고 싶다고 하면 호출하세요. 키워드에는 같은 뜻의 다른 표기(청바지/데님 등)를 함께 넣어 매칭률을 높이세요. 기본으로 무신사 입점 상품만 반환합니다.',
    inputSchema: searchProductsInputSchema,
    execute: async (input) => {
      // 기본 변경 쿼리 + 찜 브랜드 1개 쿼리를 모아 동시 호출 (동시 호출 수를 줄여 실패 회피)
      const brandQueries = (favoriteBrands ?? [])
        .slice(0, 1)
        .map((brand) =>
          buildQuery({
            keywords: input.keywords,
            brand,
            includeOtherMalls: input.includeOtherMalls,
          }),
        )
      const queries = [...new Set([...buildQueryVariants(input), ...brandQueries])]
      const settled = await Promise.allSettled(queries.map(fetchNaverShop))
      const responses = settled
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<NaverShopResponse>).value)
      if (responses.length === 0) {
        throw (settled[0] as PromiseRejectedResult).reason
      }

      // 모든 응답을 합쳐 점수·중복 제거 후 상위 풀 구성
      const merged = responses.flatMap((r) => r.items)
      let { products } = buildOutput({ total: 0, display: 0, items: merged }, input, favoriteBrands)

      // 결과가 모자라면 넓은 쿼리로 한 번 더 채움 (일부 호출 실패·좁은 검색 보정)
      if (products.length < RETURN_COUNT) {
        const broadQuery = buildQuery({
          keywords: [input.keywords[0]],
          includeOtherMalls: input.includeOtherMalls,
        })
        try {
          const broad = await fetchNaverShop(broadQuery)
          merged.push(...broad.items)
          products = buildOutput(
            { total: 0, display: 0, items: merged },
            input,
            favoriteBrands,
          ).products
        } catch {
          // 보강 실패는 무시하고 기존 결과 사용
        }
      }

      // 스타일 맞는 상품 우선, 한 브랜드가 결과를 독점하지 않게 브랜드당 개수 제한
      const onStyle = products.filter((p) => matchesStyle(p, input.styles))
      const offStyle = products.filter((p) => !matchesStyle(p, input.styles))
      const picked: MarketProduct[] = []
      const overflow: MarketProduct[] = []
      const brandCount = new Map<string, number>()

      // 풀에서 가중 랜덤으로 뽑되 브랜드 한도 초과분은 따로 보관
      const pickFrom = (items: MarketProduct[]) => {
        const pool = [...items]
        while (picked.length < RETURN_COUNT && pool.length > 0) {
          const [item] = pool.splice(weightedPickIndex(pool.length), 1)
          const brand = normalize(item.brand)
          if ((brandCount.get(brand) ?? 0) >= MAX_PER_BRAND) {
            overflow.push(item)
            continue
          }
          brandCount.set(brand, (brandCount.get(brand) ?? 0) + 1)
          picked.push(item)
        }
      }
      pickFrom(onStyle)
      pickFrom(offStyle)

      // 브랜드가 다양하지 않아 모자라면 한도 무시하고 채움
      for (const item of overflow) {
        if (picked.length >= RETURN_COUNT) break
        picked.push(item)
      }
      return { products: picked }
    },
  })

// 찜 정보 없는 기본 인스턴스
export const searchProducts = createSearchProducts()
