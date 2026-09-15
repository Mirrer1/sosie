// 찜 목록을 요약해 매 요청에 싣는 취향 신호
export type FavoriteSignals = {
  count: number // 찜한 상품 수
  brands: string[] // 자주 찜한 브랜드
  styles: string[] // 자주 찜한 상품의 스타일
  priceRange?: { min: number; max: number } // 찜한 상품의 주요 가격대
}
