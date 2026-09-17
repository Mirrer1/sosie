import {
  buildMallSearchUrl,
  buildSearchKeyword,
  isMallProductUrl,
  isMallUrl,
  mallDomain,
  toWebProductUrl,
} from '@/lib/catalog/malls'
import {
  type ImmersiveStore,
  type WebResult,
  fetchImmersiveStores,
  searchGoogleWeb,
} from '@/lib/catalog/serpApi'
import { getSql } from '@/lib/db'

const TOKEN_FRESH_MS = 24 * 60 * 60 * 1000
const LIST_PAGE_PATH =
  /search|category|categories|brand|list|event|exhibition|campaign|recommend|review/i
const MIN_TITLE_WORDS = 2
const MIN_TITLE_RATIO = 0.5
const SHORT_QUERY_WORDS = 5
const LATIN_WORD = /[a-z][a-z0-9]{2,}/g
const IGNORED_LATIN_WORDS = new Set([
  'black',
  'white',
  'gray',
  'grey',
  'navy',
  'beige',
  'blue',
  'red',
  'pink',
  'green',
  'ivory',
  'brown',
  'khaki',
  'cream',
  'charcoal',
  'sky',
  'yellow',
  'orange',
  'purple',
  'mint',
  'olive',
  'wine',
  'silver',
  'gold',
  'melange',
  'color',
  'colors',
  'size',
  'free',
  'new',
  'set',
  'the',
  'and',
  'musinsa',
])

type LinkRow = {
  brand: string
  name: string
  title: string // 수집 원문 상품명
  mall: string
  immersive_token: string | null
  direct_url: string | null
  last_seen_at: string
}

type LinkProduct = Pick<LinkRow, 'brand' | 'name' | 'mall'> & { title?: string }

// 공백을 없애고 소문자로 정규화
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()

// 판매처 조회 토큰 유효 여부
export const isTokenFresh = (lastSeenAt: string | Date, now = Date.now()): boolean =>
  now - new Date(lastSeenAt).getTime() < TOKEN_FRESH_MS

// 판매처 목록에서 같은 판매처 링크 선택
export const pickStoreLink = (stores: ImmersiveStore[], mall: string): string | null => {
  const urls = stores.flatMap((store) => (store.link ? [toWebProductUrl(store.link)] : []))
  return urls.find((url) => isMallUrl(url, mall)) ?? null
}

// 제목에 상품과 다른 영문 이름이 있는지 여부
export const hasConflictingTitleWord = (title: string, product: LinkProduct): boolean => {
  const known = normalize(`${product.brand} ${product.name} ${product.title ?? ''}`)
  const words =
    title
      .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
      .toLowerCase()
      .match(LATIN_WORD) ?? []
  return words.some((word) => !IGNORED_LATIN_WORDS.has(word) && !known.includes(word))
}

// 상품명의 영문 이름과 모델명
const identifierWords = (product: LinkProduct): string[] =>
  (product.name.toLowerCase().match(LATIN_WORD) ?? []).filter(
    (word) => !IGNORED_LATIN_WORDS.has(word),
  )

// 검색 결과 제목과 요약이 상품명과 맞는 정도 점수
export const scoreProductTitle = (title: string, product: LinkProduct, snippet = ''): number => {
  if (hasConflictingTitleWord(title, product)) return 0
  const inTitle = normalize(title)
  const haystack = normalize(`${title} ${snippet}`)
  const identifiers = identifierWords(product)
  const identified = identifiers.filter((word) => haystack.includes(word)).length
  if (identifiers.length > 0 && identified === 0) return 0
  const words = buildSearchKeyword({ ...product, brand: '' }, Infinity)
    .split(' ')
    .map(normalize)
    .filter((word) => word.length >= 2)
  if (words.length === 0) return haystack.includes(normalize(product.brand)) ? 1 : 0
  const found = words.filter((word) => haystack.includes(word)).length
  const foundInTitle = words.filter((word) => inTitle.includes(word)).length
  const enough =
    found >= Math.min(MIN_TITLE_WORDS, words.length) && found / words.length >= MIN_TITLE_RATIO
  return enough ? foundInTitle * 2 + (found - foundInTitle) + identified : 0
}

// 웹검색 결과에서 가장 잘 맞는 상품 페이지 선택
export const pickSearchResultLink = (results: WebResult[], product: LinkProduct): string | null => {
  let best: { url: string; score: number } | null = null
  for (const result of results) {
    if (!result.link || !result.title || LIST_PAGE_PATH.test(new URL(result.link).pathname))
      continue
    const url = toWebProductUrl(result.link)
    const path = new URL(url).pathname
    if (!isMallProductUrl(url, product.mall) || path === '/') continue
    const score = scoreProductTitle(result.title, product, result.snippet)
    if (score > 0 && (!best || score > best.score)) best = { url, score }
  }
  return best?.url ?? null
}

// 긴 검색어로 못 찾으면 짧은 검색어로 한 번 더 구글 웹검색
const findByWebSearch = async (product: LinkProduct, domain: string): Promise<string | null> => {
  const queries = [
    ...new Set([buildSearchKeyword(product), buildSearchKeyword(product, SHORT_QUERY_WORDS)]),
  ]
  for (const query of queries) {
    const results = await searchGoogleWeb(`site:${domain} ${query}`)
    const link = pickSearchResultLink(results, product)
    if (link) return link
  }
  return null
}

// 저장 링크, 토큰 조회, 구글 웹검색, 판매처 검색 순으로 이동할 주소 결정
export const resolveProductUrl = async (id: string): Promise<string | null> => {
  const sql = getSql()
  const rows = (await sql.query(
    'select brand, name, title, mall, immersive_token, direct_url, last_seen_at from products where id = $1',
    [id],
  )) as LinkRow[]
  const row = rows[0]
  if (!row) return null
  if (row.direct_url && isMallUrl(row.direct_url, row.mall)) return row.direct_url

  const fallback = buildMallSearchUrl(row)
  const domain = mallDomain(row.mall)
  if (!domain) return fallback

  const fromStores =
    row.immersive_token && isTokenFresh(row.last_seen_at)
      ? await fetchImmersiveStores(row.immersive_token)
          .then((stores) => pickStoreLink(stores, row.mall))
          .catch(() => null)
      : null
  const directUrl = fromStores ?? (await findByWebSearch(row, domain).catch(() => null))
  if (!directUrl) return fallback

  await sql
    .query('update products set direct_url = $1 where id = $2', [directUrl, id])
    .catch(() => null)
  return directUrl
}
