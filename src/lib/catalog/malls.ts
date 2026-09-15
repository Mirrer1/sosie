// 판매처 표기를 대표 이름으로 묶는 규칙
const MALL_ALIASES: Array<[RegExp, string]> = [
  [/무신사|musinsa/i, '무신사'],
  [/29cm/i, '29CM'],
  [/w\s?concept|w컨셉|더블유컨셉/i, 'W컨셉'],
  [/코오롱몰|kolonmall/i, '코오롱몰'],
  [/ssf\s?shop|ssf샵/i, 'SSF SHOP'],
  [/더한섬|thehandsome/i, '더한섬닷컴'],
  [/lf몰|lfmall/i, 'LF몰'],
  [/abc\s?마트|abc-?mart/i, 'ABC마트'],
  [/kream/i, 'KREAM'],
  [/솔드아웃|soldout/i, '솔드아웃'],
  [/후루츠패밀리|fruitsfamily/i, '후루츠패밀리'],
  [/^nike(\.com)?$/i, 'Nike'],
  [/^adidas/i, 'adidas'],
]

// 패션 전문 플랫폼과 백화점몰처럼 AI 판단과 무관하게 신뢰하는 판매처
const TRUSTED_MALLS = [
  '무신사',
  '29CM',
  'W컨셉',
  '코오롱몰',
  'SSF SHOP',
  '더한섬닷컴',
  'LF몰',
  'ABC마트',
  'KREAM',
  '솔드아웃',
  '후루츠패밀리',
  'Nike',
  'adidas',
]

// 판매처명을 대표 표기로 정규화
export const normalizeMall = (source: string): string => {
  const trimmed = source.trim()
  const matched = MALL_ALIASES.find(([pattern]) => pattern.test(trimmed))
  return matched ? matched[1] : trimmed
}

// 무신사 판매처 여부
export const isMusinsaMall = (mall: string): boolean => normalizeMall(mall) === '무신사'

// 고정 신뢰 목록에 있는 판매처 여부
export const isTrustedMall = (mall: string): boolean => TRUSTED_MALLS.includes(normalizeMall(mall))

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
