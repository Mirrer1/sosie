const SERPAPI_URL = 'https://serpapi.com/search.json'
const SEARCH_TIMEOUT_MS = 120000
const STORES_TIMEOUT_MS = 8000
const WEB_TIMEOUT_MS = 15000
const EMPTY_RESULT_ERROR = "Google hasn't returned any results"

export type ShoppingResult = {
  product_id?: string
  title?: string
  extracted_price?: number
  thumbnail?: string
  source?: string
  product_link?: string
  immersive_product_page_token?: string
}

export type WebResult = {
  link?: string
  title?: string
  snippet?: string
}

export type ImmersiveStore = {
  name?: string
  link?: string
  extracted_price?: number
}

// SerpApi 요청 공통 처리
const requestSerpApi = async (params: Record<string, string>, timeoutMs: number) => {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) throw new Error('SERPAPI_API_KEY가 설정되지 않았습니다.')

  const url = new URL(SERPAPI_URL)
  for (const [key, value] of Object.entries({ ...params, api_key: apiKey })) {
    url.searchParams.set(key, value)
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  const json = await res.json()
  if (json.error && !String(json.error).startsWith(EMPTY_RESULT_ERROR)) {
    throw new Error(`SerpApi 오류 ${res.status}: ${json.error}`)
  }
  return json
}

// 한국 구글 쇼핑 검색 결과 조회
export const searchGoogleShopping = async (query: string): Promise<ShoppingResult[]> => {
  const json = await requestSerpApi(
    { engine: 'google_shopping', q: query, gl: 'kr', hl: 'ko', google_domain: 'google.co.kr' },
    SEARCH_TIMEOUT_MS,
  )
  return json.shopping_results ?? []
}

// 상품 판매처 목록 조회
export const fetchImmersiveStores = async (token: string): Promise<ImmersiveStore[]> => {
  const json = await requestSerpApi(
    { engine: 'google_immersive_product', page_token: token, gl: 'kr', hl: 'ko' },
    STORES_TIMEOUT_MS,
  )
  return json.product_results?.stores ?? []
}

// 한국 구글 웹검색 결과 조회
export const searchGoogleWeb = async (query: string): Promise<WebResult[]> => {
  const json = await requestSerpApi(
    { engine: 'google', q: query, gl: 'kr', hl: 'ko', google_domain: 'google.co.kr' },
    WEB_TIMEOUT_MS,
  )
  return json.organic_results ?? []
}
