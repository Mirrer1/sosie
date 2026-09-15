import { tool } from 'ai'

import { getSql } from '@/lib/db'
import { type ProductRow } from '@/types/catalog'
import { type MarketProduct } from '@/types/product'
import {
  type SearchProductsInput,
  type SearchProductsOutput,
  searchProductsInputSchema,
} from '@/types/tool'

const CANDIDATE_LIMIT = 300
const RETURN_COUNT = 6
const POOL_COUNT = 18
const KEYWORD_SCORE = 3
const SUBCATEGORY_SCORE = 4
const BRAND_SCORE = 4
const STYLE_SCORE = 2
const FAVORITE_BRAND_SCORE = 3
const PRICE_BONUS = 2
const MAX_PER_BRAND = 2
const MIN_WORD_LENGTH = 2

// 사용자가 말한 단어를 상품명 표기로 매핑
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  청바지: ['데님'],
  바지: ['팬츠'],
  반바지: ['숏팬츠', '하프팬츠', '쇼츠'],
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

// 스타일을 상품명에 등장하는 특징 단어로 변환
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

// 검색 대상 문자열과 세부 품목을 함께 가진 내부 후보 상품
export type CandidateProduct = MarketProduct & { searchText?: string; subcategory?: string }

// 공백을 없애고 소문자로 정규화
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()

// 후보 상품의 검색 대상 문자열
const haystackOf = (product: CandidateProduct) =>
  product.searchText ?? normalize(`${product.name} ${product.brand}`)

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

// 상품이 선호 스타일 태그나 특징 단어를 하나라도 가지는지 여부
export const matchesStyle = (
  product: { name: string; brand: string; styles?: string[] },
  styles?: string[],
): boolean => {
  if (!styles?.length) return false
  if (product.styles?.some((tag) => styles.includes(tag))) return true
  const hints = styleHints(styles)
  if (hints.length === 0) return false
  const haystack = normalize(`${product.name} ${product.brand}`)
  return hints.some((hint) => haystack.includes(normalize(hint)))
}

// 상위일수록 큰 가중치로 인덱스 하나 추출
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

// DB 행을 상품 카드용 후보로 매핑하고 링크는 직링크 이동 경로로 연결
export const mapProductRow = (row: ProductRow): CandidateProduct => ({
  id: row.id,
  brand: row.brand,
  name: row.name,
  price: row.price,
  imageUrl: row.image_url,
  productUrl: `/go/${encodeURIComponent(row.id)}`,
  mall: row.mall,
  styles: row.styles,
  searchText: row.search_text,
  subcategory: row.subcategory,
})

// 후보에서 검색 대상 문자열을 빼고 응답용 상품으로 변환
const toMarketProduct = (product: CandidateProduct): MarketProduct => ({
  id: product.id,
  brand: product.brand,
  name: product.name,
  price: product.price,
  imageUrl: product.imageUrl,
  productUrl: product.productUrl,
  mall: product.mall,
  styles: product.styles,
})

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

// 동의어와 띄어쓴 단어까지 펼쳐 DB 조회용 정규화 키워드 생성
export const buildSearchKeywords = (keywords: string[]): string[] => {
  const words = keywords.flatMap((keyword) => [keyword, ...keyword.split(/\s+/)])
  const expanded = expandKeywords(words)
    .map((keyword) => normalize(keyword).replace(/[%_\\]/g, ''))
    .filter((keyword) => keyword.length >= MIN_WORD_LENGTH)
  return [...new Set(expanded)]
}

// 키워드가 검색 대상 문자열에 하나도 없으면 제외
export const matchesKeywords = (product: CandidateProduct, keywords: string[]): boolean => {
  const haystack = haystackOf(product)
  return keywords.some((keyword) => haystack.includes(normalize(keyword)))
}

// 상품명 정규화 기준으로 중복을 제거해 몰만 다른 동일 상품은 하나만 남김
export const dedupeByName = <T extends MarketProduct>(products: T[]): T[] => {
  const seen = new Set<string>()
  const result: T[] = []
  for (const product of products) {
    const key = normalize(`${product.brand} ${product.name}`)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(product)
  }
  return result
}

// 키워드, 세부 품목, 브랜드, 스타일, 예산 근접도를 합산한 입력 적합도 점수
export const scoreProduct = (
  product: CandidateProduct,
  input: SearchProductsInput,
  favoriteBrands?: string[],
): number => {
  const haystack = haystackOf(product)
  const subcategory = normalize(product.subcategory ?? '')
  let score = 0
  for (const keyword of input.keywords) {
    if (haystack.includes(normalize(keyword))) score += KEYWORD_SCORE
  }
  if (subcategory && input.keywords.some((keyword) => subcategory.includes(normalize(keyword)))) {
    score += SUBCATEGORY_SCORE
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

// 후보를 예산, 키워드, 중복, 점수 기준으로 걸러 상위 풀 구성
export const buildOutput = (
  candidates: CandidateProduct[],
  input: SearchProductsInput,
  favoriteBrands?: string[],
): { products: CandidateProduct[] } => {
  // 예산 내 결과가 적으면 예산 밖도 포함하되 근접도 점수로 예산 내 우선
  const priced = candidates.filter((p) => matchesPrice(p, input.priceMin, input.priceMax))
  const pool = priced.length >= RETURN_COUNT ? priced : candidates

  const expanded = { ...input, keywords: expandKeywords(input.keywords) }
  const matched = pool.filter((p) => matchesKeywords(p, expanded.keywords))
  const base = matched.length > 0 ? matched : pool

  const products = dedupeByName(base)
    .map((product) => ({ product, score: scoreProduct(product, expanded, favoriteBrands) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, POOL_COUNT)
    .map((entry) => entry.product)

  return { products }
}

// 키워드가 하나라도 걸리는 상품을 브랜드 일치와 매칭 수 순으로 DB에서 조회
const fetchCandidates = async (
  input: SearchProductsInput,
  favoriteBrands?: string[],
): Promise<CandidateProduct[]> => {
  const keywords = buildSearchKeywords(input.keywords)
  if (keywords.length === 0) return []

  const rows = await getSql().query(
    `select * from products p
    where ($2::boolean or p.mall = '무신사')
      and exists (select 1 from unnest($1::text[]) k where p.search_text like '%' || k || '%')
    order by
      (case when $3 <> '' and p.search_text like '%' || $3 || '%' then 1 else 0 end) desc,
      (select count(*) from unnest($1::text[]) k where p.search_text like '%' || k || '%') desc,
      (case when p.brand = any($4::text[]) then 1 else 0 end) desc,
      random()
    limit $5`,
    [
      keywords,
      input.includeOtherMalls ?? false,
      input.brand ? normalize(input.brand) : '',
      favoriteBrands ?? [],
      CANDIDATE_LIMIT,
    ],
  )
  return (rows as ProductRow[]).map(mapProductRow)
}

// 후보에서 스타일 맞는 상품을 우선하고 브랜드당 개수를 제한해 가중 랜덤으로 선택
export const pickProducts = (products: CandidateProduct[], styles?: string[]) => {
  const onStyle = products.filter((p) => matchesStyle(p, styles))
  const offStyle = products.filter((p) => !matchesStyle(p, styles))
  const picked: CandidateProduct[] = []
  const overflow: CandidateProduct[] = []
  const brandCount = new Map<string, number>()

  // 풀에서 가중 랜덤으로 뽑되 브랜드 한도 초과분은 따로 보관
  const pickFrom = (items: CandidateProduct[]) => {
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

  // 브랜드가 부족하면 한도 무시하고 채움
  for (const item of overflow) {
    if (picked.length >= RETURN_COUNT) break
    picked.push(item)
  }
  return picked
}

// 자주 찜한 브랜드를 랭킹에 반영하는 searchProducts 인스턴스 생성
export const createSearchProducts = (favoriteBrands?: string[]) =>
  tool({
    description:
      '매일 수집한 무신사 상품 풀에서 키워드와 가격대로 상품을 검색합니다. 사용자가 옷, 신발, 가방 등 패션 아이템을 사고 싶다고 하면 호출하세요. 키워드에는 같은 뜻의 다른 표기(청바지/데님 등)와 계절, 핏, 소재를 함께 넣어 매칭률을 높이세요. 기본으로 무신사 상품만 반환합니다.',
    inputSchema: searchProductsInputSchema,
    execute: async (input): Promise<SearchProductsOutput> => {
      const candidates = await fetchCandidates(input, favoriteBrands)
      const { products } = buildOutput(candidates, input, favoriteBrands)
      const picked = pickProducts(products, input.styles)
      return { products: picked.map(toMarketProduct) }
    },
  })

// 찜 정보 없는 기본 인스턴스
export const searchProducts = createSearchProducts()
