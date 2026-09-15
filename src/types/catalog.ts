export const PRODUCT_CATEGORIES = [
  '상의',
  '아우터',
  '바지',
  '스커트',
  '원피스',
  '신발',
  '가방',
  '모자',
  '액세서리',
  '기타',
] as const

export const PRODUCT_GENDERS = ['남성', '여성', '공용'] as const

// 수집 DB products 테이블 행
export type ProductRow = {
  id: string // 구글 쇼핑 상품 ID
  title: string // 수집 원문 상품명
  name: string // 브랜드를 뺀 정제 상품명
  brand: string
  price: number
  image_url: string
  mall: string // 판매처
  category: string
  subcategory: string
  gender: string
  colors: string[]
  materials: string[]
  styles: string[]
  keywords: string[] // 검색용 같은 뜻 표기
  search_text: string // 정규화한 검색 대상 문자열
  product_link: string // 구글 쇼핑 상품 페이지
  immersive_token: string | null // 판매처 조회 토큰
  direct_url: string | null // 판매처 상품 직링크
  first_seen_at: string
  last_seen_at: string
  price_updated_at: string
}
