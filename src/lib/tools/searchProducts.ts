import { tool } from 'ai'

import { SUPPORTED_MALL_NAMES } from '@/lib/catalog/malls'
import { rowToMarketProduct } from '@/lib/catalog/mapProduct'
import { getSql } from '@/lib/db'
import { type ProductRow } from '@/types/catalog'
import { type FavoriteSignals } from '@/types/favorites'
import { type MarketProduct } from '@/types/product'
import { type Profile } from '@/types/profile'
import {
  type SearchProductsInput,
  type SearchProductsOutput,
  searchProductsInputSchema,
} from '@/types/tool'

const CANDIDATE_LIMIT = 300
const RETURN_COUNT = 6
const POOL_COUNT = 30
const KEYWORD_SCORE = 3
const SUBCATEGORY_SCORE = 4
const BRAND_SCORE = 4
const STYLE_SCORE = 2
const PREFERRED_BRAND_SCORE = 3
const FAVORITE_STYLE_SCORE = 2
const FAVORITE_PRICE_SCORE = 2
const EXACT_GENDER_SCORE = 2
const OTHER_MALL_SCORE = 3
const PRICE_BONUS = 2
const MAX_PER_BRAND = 2
const OTHER_MALL_SLOTS = 3
const MAX_REPEATED_PREFERRED = 2
const MIN_WORD_LENGTH = 2
const COLOR_SCORE = 4

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
  빨간: ['레드'],
  빨간색: ['레드'],
  빨강: ['레드'],
  노란: ['옐로우'],
  노란색: ['옐로우'],
  노랑: ['옐로우'],
  파란: ['블루'],
  파란색: ['블루'],
  파랑: ['블루'],
  초록: ['그린'],
  초록색: ['그린'],
  검정: ['블랙'],
  검정색: ['블랙'],
  검은: ['블랙'],
  까만: ['블랙'],
  흰: ['화이트'],
  흰색: ['화이트'],
  하얀: ['화이트'],
  회색: ['그레이'],
  분홍: ['핑크'],
  분홍색: ['핑크'],
  보라: ['퍼플'],
  보라색: ['퍼플'],
  남색: ['네이비'],
  갈색: ['브라운'],
}

const VIVID_COLORS = [
  '레드',
  '옐로우',
  '오렌지',
  '그린',
  '블루',
  '핑크',
  '퍼플',
  '민트',
  '레몬',
  '라임',
  '코랄',
  '네온',
]
const DARK_COLORS = [
  '블랙',
  '그레이',
  '차콜',
  '네이비',
  '다크',
  'black',
  'gray',
  'grey',
  'charcoal',
  'navy',
]

// 색상 분위기 표현을 가산점 색상과 감점 색상으로 변환
const COLOR_MOODS: Array<{ words: string[]; include: string[]; exclude: string[] }> = [
  {
    words: ['비비드', '컬러풀', '화사', '밝은', '원색', '쨍한', '선명', '알록달록'],
    include: VIVID_COLORS,
    exclude: DARK_COLORS,
  },
  {
    words: ['어두운', '무채색', '톤다운', '모노톤', '차분한'],
    include: DARK_COLORS,
    exclude: VIVID_COLORS,
  },
  {
    words: ['파스텔', '연한', '은은한'],
    include: ['라이트', '스카이', '민트', '라벤더', '크림', '베이비', '파스텔', '아이보리'],
    exclude: DARK_COLORS,
  },
]

// 상품명 매칭에서 빼는 색상 일반어
const COLOR_FILLER_WORDS = ['컬러', '색상', '색깔', '색', '컬러감', '톤', '계열']

// 색상 이름 목록
const COLOR_NAMES = new Set([
  ...VIVID_COLORS,
  ...DARK_COLORS,
  '화이트',
  '베이지',
  '브라운',
  '카키',
  '아이보리',
  '크림',
  '실버',
  '골드',
  '와인',
  '버건디',
  '올리브',
  '라벤더',
  '스카이',
  '라이트',
  '다른',
  ...COLOR_FILLER_WORDS,
])

const REPEATED_NOTICE_COUNT = 3

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
  클래식: ['테일러드', '옥스포드', '트위드', '울'],
  고프코어: ['바람막이', '고어텍스', '플리스', '아노락', '윈드'],
}

// 검색어에 들어 있으면 성별 필터로 바꾸는 단어
const GENDER_KEYWORDS: Record<ProductGender, string[]> = {
  남성: ['남자', '남성', '남자용', '남성용', '맨즈'],
  여성: ['여자', '여성', '여자용', '여성용', '우먼', '레이디스'],
}

type ProductGender = '남성' | '여성'

// 검색 문자열을 가진 후보 상품
export type CandidateProduct = MarketProduct & { searchText?: string }

// 요청마다 주입하는 검색 옵션
export type SearchContext = {
  profile?: Profile | null
  favorites?: FavoriteSignals | null
  shownIds?: string[] // 이미 보여준 상품 ID
  previousKeywords?: string[] // 같은 대화의 직전 검색 키워드
  conversationShownIds?: string[] // 같은 대화에서 보여준 상품 ID
}

// 요청 조건과 별개로 가산점만 주는 사용자 취향
export type SearchPreferences = {
  brands: string[] // 정규화한 프로필 선호 브랜드와 찜 브랜드
  favoriteStyles: string[] // 찜한 상품에서 자주 보인 스타일
  favoritePriceRange?: { min: number; max: number } // 예산이 없을 때 참고할 찜 가격대
  gender?: ProductGender | null // 공용보다 앞세울 정확한 성별
  colors?: ColorIntent | null // 이번 요청의 색상 분위기
}

// 가산점 색상과 감점 색상
export type ColorIntent = {
  include: string[]
  exclude: string[]
}

// 프로필을 채운 검색 입력과 검색어에서 뽑은 조건
export type ResolvedSearch = {
  input: SearchProductsInput
  gender: ProductGender | null
  colors: ColorIntent | null
}

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

// 선호 스타일 일치 여부
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

// DB 행을 후보 상품으로 매핑
export const mapProductRow = (row: ProductRow): CandidateProduct => ({
  ...rowToMarketProduct(row),
  searchText: row.search_text,
})

// 후보를 응답용 상품으로 변환
const toMarketProduct = ({ searchText, ...product }: CandidateProduct): MarketProduct => {
  void searchText
  return product
}

// 가격 범위 필터
const matchesPrice = (product: MarketProduct, priceMin?: number, priceMax?: number): boolean => {
  if (priceMin !== undefined && product.price < priceMin) return false
  if (priceMax !== undefined && product.price > priceMax) return false
  return true
}

// 키워드에 동의어 추가
export const expandKeywords = (keywords: string[]): string[] => {
  const result = new Set<string>()
  for (const keyword of keywords) {
    result.add(keyword)
    const synonyms = KEYWORD_SYNONYMS[keyword.replace(/\s+/g, '')]
    if (synonyms) synonyms.forEach((s) => result.add(s))
  }
  return [...result]
}

// DB 조회용 키워드 생성
export const buildSearchKeywords = (keywords: string[]): string[] => {
  const words = keywords.flatMap((keyword) => [keyword, ...keyword.split(/\s+/)])
  const expanded = expandKeywords(words)
    .map((keyword) => normalize(keyword).replace(/[%_\\]/g, ''))
    .filter((keyword) => keyword.length >= MIN_WORD_LENGTH)
  return [...new Set(expanded)]
}

// 색상 이름이거나 색상 동의어인 단어 여부
const isColorWord = (word: string): boolean => {
  const normalized = normalize(word)
  return (
    COLOR_NAMES.has(normalized) ||
    (KEYWORD_SYNONYMS[normalized]?.every((synonym) => COLOR_NAMES.has(synonym)) ?? false) ||
    COLOR_MOODS.some((mood) => mood.words.some((w) => normalized.includes(w)))
  )
}

// 검색어가 색상뿐이면 직전 검색의 품목 키워드를 앞에 붙임
export const withPreviousItemKeywords = (keywords: string[], previous: string[] = []): string[] => {
  const words = keywords.flatMap((keyword) => keyword.split(/\s+/)).filter(Boolean)
  if (!words.every(isColorWord)) return keywords
  const items = previous.filter((keyword) => !keyword.split(/\s+/).every(isColorWord))
  return items.length > 0 ? [...new Set([...items, ...keywords])] : keywords
}

// 검색어의 색상 표현을 가산점 색상으로 분리
export const extractColorIntent = (
  keywords: string[],
): { keywords: string[]; colors: ColorIntent | null } => {
  const moods = new Set<(typeof COLOR_MOODS)[number]>()
  const rest = keywords.flatMap((keyword) => {
    const words = keyword.split(/\s+/).filter((word) => {
      const normalized = normalize(word)
      const mood = COLOR_MOODS.find((m) => m.words.some((w) => normalized.includes(w)))
      if (mood) moods.add(mood)
      return !mood && !COLOR_FILLER_WORDS.includes(normalized) && normalized !== '다른'
    })
    return words.length > 0 ? [words.join(' ')] : []
  })

  const colorKeywords = rest.filter((keyword) => keyword.split(/\s+/).every(isColorWord))
  const itemKeywords = rest.filter((keyword) => !colorKeywords.includes(keyword))
  const namedColors =
    itemKeywords.length > 0 ? colorKeywords.flatMap((keyword) => expandKeywords([keyword])) : []

  const include = [...new Set([...[...moods].flatMap((m) => m.include), ...namedColors])]
  const exclude = [...new Set([...moods].flatMap((m) => m.exclude))]
  const colors = include.length > 0 ? { include, exclude } : null
  return { keywords: itemKeywords.length > 0 ? itemKeywords : rest, colors }
}

// 색상 일치 여부
export const matchesColor = (product: CandidateProduct, colors: string[]): boolean => {
  const haystack = normalize(`${product.colors?.join(' ') ?? ''} ${haystackOf(product)}`)
  return colors.some((color) => haystack.includes(normalize(color)))
}

// 검색어 성별을 필터로 옮기고 생략된 조건을 프로필로 채움
export const resolveSearchInput = (
  input: SearchProductsInput,
  profile?: Profile | null,
): ResolvedSearch => {
  let gender: ProductGender | null = profile?.gender ?? null
  const { keywords: withoutColors, colors } = extractColorIntent(input.keywords)
  const rest = withoutColors.filter((keyword) => {
    const word = normalize(keyword)
    const matched = (Object.keys(GENDER_KEYWORDS) as ProductGender[]).find((key) =>
      GENDER_KEYWORDS[key].includes(word),
    )
    if (matched) gender = matched
    return !matched
  })

  const hasRequestBudget = input.priceMin !== undefined || input.priceMax !== undefined

  return {
    gender,
    colors,
    input: {
      ...input,
      keywords: rest.length > 0 ? rest : withoutColors.length > 0 ? withoutColors : input.keywords,
      styles: input.styles?.length ? input.styles : profile?.styles,
      priceMin: hasRequestBudget ? input.priceMin : profile?.budget?.min,
      priceMax: hasRequestBudget ? input.priceMax : profile?.budget?.max,
    },
  }
}

// 프로필 선호 브랜드와 찜 요약을 가산점용 취향으로 합침
export const buildPreferences = (
  profile?: Profile | null,
  favorites?: FavoriteSignals | null,
): SearchPreferences => ({
  brands: [...new Set([...(profile?.brands ?? []), ...(favorites?.brands ?? [])].map(normalize))],
  favoriteStyles: favorites?.styles ?? [],
  favoritePriceRange: favorites?.priceRange,
})

// 키워드 일치 여부
export const matchesKeywords = (product: CandidateProduct, keywords: string[]): boolean => {
  const haystack = haystackOf(product)
  return keywords.some((keyword) => haystack.includes(normalize(keyword)))
}

// 같은 이름의 중복 상품 제거
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

// 요청과 취향 기준 적합도 점수
export const scoreProduct = (
  product: CandidateProduct,
  input: SearchProductsInput,
  preferences?: SearchPreferences,
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
  if (preferences?.brands.some((brand) => normalize(product.brand) === normalize(brand))) {
    score += PREFERRED_BRAND_SCORE
  }
  if (product.styles?.some((style) => preferences?.favoriteStyles.includes(style))) {
    score += FAVORITE_STYLE_SCORE
  }
  if (preferences?.gender && product.gender === preferences.gender) score += EXACT_GENDER_SCORE
  if (input.includeOtherMalls && product.mall !== '무신사') score += OTHER_MALL_SCORE
  if (preferences?.colors && matchesColor(product, preferences.colors.include)) score += COLOR_SCORE
  if (preferences?.colors && matchesColor(product, preferences.colors.exclude)) score -= COLOR_SCORE
  const range = preferences?.favoritePriceRange
  const hasBudget = input.priceMin !== undefined || input.priceMax !== undefined
  if (!hasBudget && range && product.price >= range.min && product.price <= range.max) {
    score += FAVORITE_PRICE_SCORE
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

// 후보를 걸러 점수순으로 정렬하고 새 상품을 앞에 둔 풀 구성
export const buildOutput = (
  candidates: CandidateProduct[],
  input: SearchProductsInput,
  preferences?: SearchPreferences,
  shownIds: string[] = [],
): { products: CandidateProduct[] } => {
  const priced = candidates.filter((p) => matchesPrice(p, input.priceMin, input.priceMax))
  const pool = priced.length >= RETURN_COUNT ? priced : candidates

  const expanded = { ...input, keywords: expandKeywords(input.keywords) }
  const matched = pool.filter((p) => matchesKeywords(p, expanded.keywords))
  const base = matched.length > 0 ? matched : pool

  const ranked = dedupeByName(base)
    .map((product) => ({ product, score: scoreProduct(product, expanded, preferences) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product)

  const shown = new Set(shownIds)
  const unseen = ranked.filter((p) => !shown.has(p.id))
  const seen = ranked.filter((p) => shown.has(p.id))
  const others = input.includeOtherMalls ? unseen.filter((p) => p.mall !== '무신사') : []
  const products = [
    ...new Set([
      ...unseen.slice(0, POOL_COUNT),
      ...others.slice(0, POOL_COUNT),
      ...seen.slice(0, POOL_COUNT),
    ]),
  ]

  return { products }
}

// 키워드가 걸리는 후보 상품을 DB에서 조회
const fetchCandidates = async (
  { input, gender }: ResolvedSearch,
  preferences: SearchPreferences,
): Promise<CandidateProduct[]> => {
  const keywords = buildSearchKeywords(input.keywords)
  if (keywords.length === 0) return []

  const rows = await getSql().query(
    `select * from products p
    where (p.mall = '무신사' or ($8::boolean and p.mall = any($9::text[])))
      and ($5::text is null or p.gender in ($5::text, '공용'))
      and exists (select 1 from unnest($1::text[]) k where p.search_text like '%' || k || '%')
    order by
      (case when $2 <> '' and p.search_text like '%' || $2 || '%' then 1 else 0 end) desc,
      (case when $8::boolean and p.mall <> '무신사' then 1 else 0 end) desc,
      (case when ($6::int is null or p.price >= $6::int) and ($7::int is null or p.price <= $7::int)
        then 1 else 0 end) desc,
      (select count(*) from unnest($1::text[]) k where p.search_text like '%' || k || '%') desc,
      (case when replace(lower(p.brand), ' ', '') = any($3::text[]) then 1 else 0 end) desc,
      random()
    limit $4`,
    [
      keywords,
      input.brand ? normalize(input.brand).replace(/[%_\\]/g, '') : '',
      preferences.brands,
      CANDIDATE_LIMIT,
      gender,
      input.priceMin ?? null,
      input.priceMax ?? null,
      input.includeOtherMalls ?? false,
      SUPPORTED_MALL_NAMES,
    ],
  )
  return (rows as ProductRow[]).map(mapProductRow)
}

// 요청과 프로필 스타일이 없으면 찜 스타일 사용
export const pickStyles = (input: SearchProductsInput, preferences: SearchPreferences) =>
  input.styles?.length ? input.styles : preferences.favoriteStyles

// 후보 선택 옵션
export type PickOptions = {
  styles?: string[]
  brands?: string[] // 정규화한 프로필 선호 브랜드와 찜 브랜드
  shownIds?: string[]
  colors?: ColorIntent | null // 있으면 색상으로 선호 판단
}

// 선호 상품과 새 상품을 우선해 가중 랜덤으로 선택
export const pickProducts = (
  products: CandidateProduct[],
  { styles, brands = [], shownIds = [], colors }: PickOptions = {},
) => {
  const shown = new Set(shownIds)
  const isPreferred = (p: CandidateProduct) =>
    colors
      ? matchesColor(p, colors.include) && !matchesColor(p, colors.exclude)
      : matchesStyle(p, styles) || brands.includes(normalize(p.brand))
  const picked: CandidateProduct[] = []
  const overflow: CandidateProduct[] = []
  const brandCount = new Map<string, number>()

  // 브랜드 한도 안에서 가중 랜덤으로 뽑기
  const pickFrom = (items: CandidateProduct[], limit = RETURN_COUNT) => {
    const pool = [...items]
    let count = 0
    while (picked.length < RETURN_COUNT && count < limit && pool.length > 0) {
      const [item] = pool.splice(weightedPickIndex(pool.length), 1)
      const brand = normalize(item.brand)
      if ((brandCount.get(brand) ?? 0) >= MAX_PER_BRAND) {
        overflow.push(item)
        continue
      }
      brandCount.set(brand, (brandCount.get(brand) ?? 0) + 1)
      picked.push(item)
      count++
    }
  }
  pickFrom(products.filter((p) => isPreferred(p) && !shown.has(p.id)))
  pickFrom(
    products.filter((p) => isPreferred(p) && shown.has(p.id)),
    MAX_REPEATED_PREFERRED,
  )
  pickFrom(products.filter((p) => !isPreferred(p) && !shown.has(p.id)))
  pickFrom(products.filter((p) => !isPreferred(p) && shown.has(p.id)))
  pickFrom(products.filter((p) => isPreferred(p) && shown.has(p.id) && !picked.includes(p)))

  for (const item of overflow) {
    if (picked.length >= RETURN_COUNT) break
    picked.push(item)
  }
  return picked
}

// 다른 판매처 요청이면 다른 판매처 상품에 자리를 먼저 배정
export const pickWithOtherMalls = (
  products: CandidateProduct[],
  options: PickOptions,
  includeOtherMalls?: boolean,
) => {
  if (!includeOtherMalls) return pickProducts(products, options)
  const reserved = pickProducts(
    products.filter((p) => p.mall !== '무신사'),
    options,
  ).slice(0, OTHER_MALL_SLOTS)
  const rest = pickProducts(
    products.filter((p) => !reserved.includes(p)),
    options,
  ).slice(0, RETURN_COUNT - reserved.length)
  return [...rest, ...reserved]
}

// 예산 밖 상품 포함 여부
export const hasOutOfBudget = (products: MarketProduct[], input: SearchProductsInput) =>
  (input.priceMin !== undefined || input.priceMax !== undefined) &&
  products.some((p) => !matchesPrice(p, input.priceMin, input.priceMax))

// 프로필과 찜을 반영하는 searchProducts 생성
export const createSearchProducts = ({
  profile,
  favorites,
  shownIds,
  previousKeywords,
  conversationShownIds,
}: SearchContext = {}) =>
  tool({
    description:
      '매일 수집한 상품 풀에서 키워드와 가격대로 상품을 검색합니다. 사용자가 옷, 신발, 가방 등 패션 아이템을 사고 싶다고 하면 호출하세요. 키워드에는 같은 뜻의 다른 표기(청바지/데님 등)와 계절, 핏, 소재, 성별(남자/여자)을 함께 넣어 매칭률을 높이세요. 프로필의 스타일, 선호 브랜드, 예산과 찜한 상품의 취향은 서버가 자동 반영합니다. 기본으로 무신사 상품만 반환합니다.',
    inputSchema: searchProductsInputSchema,
    execute: async (input): Promise<SearchProductsOutput> => {
      const keywords = withPreviousItemKeywords(input.keywords, previousKeywords)
      const resolved = resolveSearchInput({ ...input, keywords }, profile)
      const preferences = {
        ...buildPreferences(profile, favorites),
        gender: resolved.gender,
        colors: resolved.colors,
      }
      const candidates = await fetchCandidates(resolved, preferences)
      const { products } = buildOutput(candidates, resolved.input, preferences, shownIds)
      const picked = pickWithOtherMalls(
        products,
        {
          styles: pickStyles(resolved.input, preferences),
          brands: preferences.brands,
          shownIds,
          colors: resolved.colors,
        },
        resolved.input.includeOtherMalls,
      )
      const repeatedCount = picked.filter((p) => conversationShownIds?.includes(p.id)).length
      return {
        products: picked.map(toMarketProduct),
        outOfBudget: hasOutOfBudget(picked, resolved.input),
        repeatedCount,
        notice:
          repeatedCount >= REPEATED_NOTICE_COUNT
            ? `이 조건에 맞는 상품은 대부분 이미 보여드렸어요. 결과 ${picked.length}개 중 ${repeatedCount}개가 앞서 보여준 상품이니 새로 찾았다고 말하지 말고, 가격대나 품목, 스타일을 넓혀보자고 제안하세요.`
            : undefined,
      }
    },
  })

// 프로필과 찜 정보 없는 기본 인스턴스
export const searchProducts = createSearchProducts()
