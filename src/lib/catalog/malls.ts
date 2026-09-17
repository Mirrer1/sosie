const MAX_SEARCH_WORDS = 6

// 지원 판매처
type SupportedMall = {
  name: string // DB에 저장하는 대표 이름
  pattern: RegExp // 구글 쇼핑 판매처 표기 매칭 규칙
  domain: string // 상품 링크 도메인
  searchUrl: string // 사이트 검색 주소
}

// 사이트 검색 주소를 확인한 판매처 목록
const SUPPORTED_MALLS: SupportedMall[] = [
  {
    name: '무신사',
    pattern: /무신사|musinsa/i,
    domain: 'musinsa.com',
    searchUrl: 'https://www.musinsa.com/search/goods?keyword=',
  },
  {
    name: '29CM',
    pattern: /29cm/i,
    domain: '29cm.co.kr',
    searchUrl: 'https://www.29cm.co.kr/store/search?keyword=',
  },
  {
    name: 'W컨셉',
    pattern: /w\s?concept|w컨셉|더블유컨셉/i,
    domain: 'wconcept.co.kr',
    searchUrl: 'https://display.wconcept.co.kr/search?kwd=',
  },
  {
    name: '코오롱몰',
    pattern: /코오롱몰|kolonmall/i,
    domain: 'kolonmall.com',
    searchUrl: 'https://www.kolonmall.com/Search?keyword=',
  },
  {
    name: 'SSF SHOP',
    pattern: /ssf\s?shop|ssf샵/i,
    domain: 'ssfshop.com',
    searchUrl: 'https://www.ssfshop.com/search/result?keyword=',
  },
  {
    name: 'ABC마트',
    pattern: /abc\s?마트|abc-?mart/i,
    domain: 'a-rt.com',
    searchUrl: 'https://abcmart.a-rt.com/display/search-word/result?searchWord=',
  },
  {
    name: 'KREAM',
    pattern: /kream/i,
    domain: 'kream.co.kr',
    searchUrl: 'https://kream.co.kr/search?keyword=',
  },
  {
    name: 'Nike',
    pattern: /^nike(\.com)?$/i,
    domain: 'nike.com',
    searchUrl: 'https://www.nike.com/kr/w?q=',
  },
  {
    name: 'adidas',
    pattern: /^adidas/i,
    domain: 'adidas.co.kr',
    searchUrl: 'https://www.adidas.co.kr/search?q=',
  },
  {
    name: 'thenorthface',
    pattern: /north\s?face|노스페이스/i,
    domain: 'thenorthfacekorea.co.kr',
    searchUrl: 'https://www.thenorthfacekorea.co.kr/search?q=',
  },
  {
    name: 'anderssonbell',
    pattern: /andersson\s?bell|앤더슨벨/i,
    domain: 'anderssonbell.com',
    searchUrl: 'https://anderssonbell.com/product/search.html?keyword=',
  },
  {
    name: 'Stand oil',
    pattern: /stand\s?oil|스탠드오일/i,
    domain: 'standoil.kr',
    searchUrl: 'https://standoil.kr/product/search.html?keyword=',
  },
]

export const SUPPORTED_MALL_NAMES = SUPPORTED_MALLS.map((mall) => mall.name)

const MUSINSA = SUPPORTED_MALLS[0]

// 판매처 표기로 지원 판매처 찾기
const findMall = (source: string): SupportedMall | undefined =>
  SUPPORTED_MALLS.find((mall) => mall.pattern.test(source.trim()))

// 판매처명을 대표 표기로 정규화
export const normalizeMall = (source: string): string => findMall(source)?.name ?? source.trim()

// 무신사 판매처 여부
export const isMusinsaMall = (mall: string): boolean => normalizeMall(mall) === MUSINSA.name

// 지원 판매처 여부
export const isSupportedMall = (mall: string): boolean => findMall(mall) !== undefined

// 링크가 판매처 도메인인지 여부
export const isMallUrl = (link: string, mall: string): boolean => {
  const info = findMall(mall)
  if (!info) return false
  try {
    const { hostname } = new URL(link)
    return hostname === info.domain || hostname.endsWith(`.${info.domain}`)
  } catch {
    return false
  }
}

// 무신사 앱 링크를 웹 상품 페이지로 변환하고 추적 파라미터 제거
export const toWebProductUrl = (link: string): string => {
  try {
    const url = new URL(link)
    url.searchParams.delete('srsltid')
    const goods = url.hostname === 'link.musinsa.com' && url.pathname.match(/\/goods\/(\d+)/)
    return goods ? `https://www.musinsa.com/products/${goods[1]}` : url.toString()
  } catch {
    return link
  }
}

// 브랜드와 상품명을 판매처 검색어로 짧게 정리
export const buildSearchKeyword = ({
  brand,
  name,
  mall,
}: {
  brand: string
  name: string
  mall: string
}): string => {
  const cleanName = name
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/\b\d+\s?colors?\b/gi, ' ')
    .replace(/[/+_,|]/g, ' ')
  const cleanBrand = brand.trim()
  const withBrand =
    cleanBrand && cleanBrand !== mall && !cleanName.includes(cleanBrand)
      ? `${cleanBrand} ${cleanName}`
      : cleanName
  const words = withBrand
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word))
    .slice(0, MAX_SEARCH_WORDS)
  return words.length > 0 ? words.join(' ') : cleanBrand
}

// 판매처 검색 링크를 만들고 지원 밖 판매처는 무신사 검색으로 연결
export const buildMallSearchUrl = (product: { brand: string; name: string; mall: string }) => {
  const mall = findMall(product.mall) ?? MUSINSA
  return `${mall.searchUrl}${encodeURIComponent(buildSearchKeyword(product))}`
}
