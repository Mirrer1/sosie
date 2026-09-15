import { tool } from 'ai'

import { getSql } from '@/lib/db'
import { type ProductRow } from '@/types/catalog'
import {
  type ComparePricesInput,
  type ComparePricesOutput,
  comparePricesInputSchema,
} from '@/types/tool'

const CANDIDATE_LIMIT = 200
const RELEVANCE_RATIO = 0.5
const MIN_TOKEN_MATCH = 2
const GENERIC_BRAND_KEYS = ['브랜드미상', '판매처미상', '무신사', '알수없음']

type Source = ComparePricesOutput['sources'][number]

// 영문과 숫자가 섞인 4글자 이상 토큰을 모델코드로 인식
const MODEL_CODE_REGEX = /\b(?=[A-Za-z]*\d)(?=[0-9]*[A-Za-z])[A-Za-z0-9]{4,}(?:-[A-Za-z0-9]+)?\b/g

// 공백을 없애고 소문자로 정규화
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()

// 상품명에서 대괄호, 소괄호, 모델코드를 제거해 비교용으로 정제
export const cleanProductName = (name: string): string =>
  name
    .replace(/[[\]]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(MODEL_CODE_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// 모델코드에서 색상 등 끝 글자를 떼고 식별용 핵심부만 추출
export const extractModelCodes = (name: string): string[] => {
  const matches = name.match(MODEL_CODE_REGEX) ?? []
  return matches
    .map((code) =>
      code
        .toUpperCase()
        .replace(/-/g, '')
        .replace(/[A-Z]+$/, ''),
    )
    .filter((code) => code.length >= 4)
}

// 정제한 상품명을 2글자 이상 토큰으로 분리
const tokenize = (name: string): string[] =>
  cleanProductName(name)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 2)

// 브랜드 불일치, 모델코드 충돌, 구별 단어 부족으로 같은 상품이 아닌 판매처 제외
export const filterRelevantSources = (
  sources: Source[],
  productName: string,
  brand?: string,
): Source[] => {
  const tokens = tokenize(productName)
  if (tokens.length === 0) return sources

  const brandTokens = brand ? tokenize(brand) : tokens.slice(0, 1)
  const brandKey = brandTokens.join('').replace(/\s/g, '')
  const enforceBrand = brandKey.length >= 2 && !GENERIC_BRAND_KEYS.includes(brandKey)

  // 브랜드 빼고 상품을 구별하는 단어들
  const descriptive = tokens.filter((token) => !brandTokens.includes(token))
  const threshold = Math.min(
    descriptive.length,
    Math.max(MIN_TOKEN_MATCH, Math.ceil(descriptive.length * RELEVANCE_RATIO)),
  )
  const originalCodes = extractModelCodes(productName)

  return sources.filter((source) => {
    const cleaned = cleanProductName(source.title ?? '').toLowerCase()

    // 브랜드가 제목에 없으면 제외
    if (enforceBrand && !cleaned.replace(/\s/g, '').includes(brandKey)) return false

    // 결과에 모델코드가 있는데 원본 코드와 다르면 제외
    if (originalCodes.length > 0) {
      const codes = extractModelCodes(source.title ?? '')
      if (codes.length > 0 && !codes.some((code) => originalCodes.includes(code))) return false
    }

    // 브랜드 뺀 구별 단어가 기준 이상 겹쳐야 통과
    const matched = descriptive.filter((token) => cleaned.includes(token)).length
    return matched >= threshold
  })
}

// DB 행을 판매처 항목으로 변환
export const mapRowToSource = (row: ProductRow): Source => ({
  seller: row.mall,
  price: row.price,
  url: `/go/${encodeURIComponent(row.id)}`,
  imageUrl: row.image_url,
  title: `${row.brand} ${row.name}`,
})

// 판매처마다 가장 싼 항목 하나만 남김
export const pickCheapestPerSeller = (sources: Source[]): Source[] => {
  const bySeller = new Map<string, Source>()
  for (const source of sources) {
    const current = bySeller.get(source.seller)
    if (!current || source.price < current.price) bySeller.set(source.seller, source)
  }
  return [...bySeller.values()]
}

// 수집 DB에서 같은 상품을 판매처별로 찾아 가격을 비교하며 Tool과 카드 모달이 함께 재사용
export const runComparePrices = async ({
  productId,
  productName,
  brand,
}: ComparePricesInput): Promise<ComparePricesOutput> => {
  const sql = getSql()
  const baseRows = productId
    ? ((await sql.query('select * from products where id = $1', [productId])) as ProductRow[])
    : []
  const base = baseRows[0]

  const name = base ? `${base.brand} ${base.name}` : productName
  const brandName = base?.brand ?? brand
  const brandKey = normalize(brandName || tokenize(productName)[0] || '')
  if (brandKey.length < 2) return { sources: base ? [mapRowToSource(base)] : [] }

  const rows = (await sql.query(
    `select * from products where search_text like '%' || $1 || '%'
    order by last_seen_at desc limit $2`,
    [brandKey.replace(/[%_\\]/g, ''), CANDIDATE_LIMIT],
  )) as ProductRow[]

  const candidates = base ? [base, ...rows.filter((row) => row.id !== base.id)] : rows
  const relevant = filterRelevantSources(candidates.map(mapRowToSource), name, brandName)
  return { sources: pickCheapestPerSeller(relevant) }
}

export const comparePrices = tool({
  description:
    '매일 수집한 판매처 데이터에서 같은 상품의 판매처별 가격을 비교합니다. 사용자가 가격, 어디서 사는 게 싼지, 판매처 비교를 물을 때 호출하세요.',
  inputSchema: comparePricesInputSchema,
  execute: async (input) => runComparePrices(input),
})
