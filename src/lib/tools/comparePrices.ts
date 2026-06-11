import { tool } from 'ai'

import { type ComparePricesOutput, comparePricesInputSchema } from '@/types/tool'

const NAVER_SHOP_API_URL = 'https://openapi.naver.com/v1/search/shop.json'
const DISPLAY_COUNT = 10
const RELEVANCE_RATIO = 0.5
const MIN_TOKEN_MATCH = 2

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

// 영문+숫자가 섞인 4글자 이상 토큰을 모델코드로 인식
const MODEL_CODE_REGEX = /\b(?=[A-Za-z]*\d)(?=[0-9]*[A-Za-z])[A-Za-z0-9]{4,}(?:-[A-Za-z0-9]+)?\b/g

// 상품명에서 대괄호 기호, 소괄호 내용, 모델코드를 제거해 검색·비교용으로 정제
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

// 브랜드 일치 + 모델코드 충돌 제외 + 토큰 겹침으로 판매처를 거름, 전부 걸러지면 원본 유지
export const filterRelevantSources = (
  sources: ComparePricesOutput['sources'],
  productName: string,
): ComparePricesOutput['sources'] => {
  const tokens = tokenize(productName)
  if (tokens.length === 0) return sources

  const brandKey = tokens[0]
  const originalCodes = extractModelCodes(productName)
  const threshold = Math.max(MIN_TOKEN_MATCH, Math.ceil(tokens.length * RELEVANCE_RATIO))

  const relevant = sources.filter((source) => {
    const cleaned = cleanProductName(source.title ?? '').toLowerCase()

    // 브랜드명이 제목에 없으면 제외
    if (!cleaned.replace(/\s/g, '').includes(brandKey)) return false

    // 결과에 모델코드가 있는데 원본 코드와 다르면 제외
    if (originalCodes.length > 0) {
      const codes = extractModelCodes(source.title ?? '')
      if (codes.length > 0 && !codes.some((code) => originalCodes.includes(code))) return false
    }

    const matched = tokens.filter((token) => cleaned.includes(token)).length
    return matched >= threshold
  })

  return relevant.length > 0 ? relevant : sources
}

// 네이버 쇼핑 검색 결과 URL은 외부 진입 시 차단됨, 검색 페이지로 우회
const NAVER_BLOCKED_HOSTS = ['shopping.naver.com', 'search.shopping.naver.com']

const buildSafeUrl = (link: string, productName: string, mallName: string): string => {
  try {
    const host = new URL(link).hostname
    if (NAVER_BLOCKED_HOSTS.some((h) => host.endsWith(h))) {
      const query = [productName, mallName].filter(Boolean).join(' ')
      return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(query)}`
    }
    return link
  } catch {
    return link
  }
}

// 네이버 응답을 Sosie 스키마로 매핑, 네이버 차단 URL은 검색 페이지로 우회
export const mapNaverResponse = (
  data: NaverShopResponse,
  productName: string,
): ComparePricesOutput => {
  return {
    sources: data.items.map((item) => ({
      seller: item.mallName || '알 수 없음',
      price: parseInt(item.lprice, 10),
      url: buildSafeUrl(item.link, productName, item.mallName ?? ''),
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
  url.searchParams.set('exclude', 'used:rental:cbshop')

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

// 상품명으로 판매처별 가격 비교, Tool과 카드 모달 양쪽에서 재사용
export const runComparePrices = async (productName: string): Promise<ComparePricesOutput> => {
  const query = cleanProductName(productName) || productName
  const data = await fetchNaverShop(query)
  const mapped = mapNaverResponse(data, productName)
  return { sources: filterRelevantSources(mapped.sources, productName) }
}

export const comparePrices = tool({
  description:
    '같은 상품을 여러 판매처에서 가격 비교합니다. 사용자가 가격, 어디서 사는 게 싼지, 판매처 비교를 물을 때 호출하세요.',
  inputSchema: comparePricesInputSchema,
  execute: async ({ productName }) => runComparePrices(productName),
})
