import { z } from 'zod'

import { type FavoriteSignals } from '@/types/favorites'
import { type MarketProduct, marketProductSchema } from '@/types/product'

const STORAGE_KEY = 'sosie:favorites'
const favoritesSchema = z.array(marketProductSchema)
const GENERIC_BRANDS = ['무신사', '브랜드 미상', '판매처 미상']
const SIGNAL_BRAND_LIMIT = 3
const SIGNAL_STYLE_LIMIT = 2
const REPEATED_STYLE_FROM = 3
const SINGLE_PRICE_SPREAD = 0.3
const PRICE_ROUND = 1000

// 찜 상품 스타일을 빈도순으로 추출
export const topFavoriteStyles = (
  favorites: MarketProduct[],
  limit = SIGNAL_STYLE_LIMIT,
): string[] => {
  const counts = new Map<string, number>()
  for (const fav of favorites) {
    for (const style of fav.styles ?? []) counts.set(style, (counts.get(style) ?? 0) + 1)
  }
  const minCount = favorites.length >= REPEATED_STYLE_FROM ? 2 : 1
  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([style]) => style)
}

// 찜 상품의 주요 가격대 계산
export const favoritePriceRange = (favorites: MarketProduct[]): FavoriteSignals['priceRange'] => {
  const prices = favorites
    .map((fav) => fav.price)
    .filter((price) => price > 0)
    .sort((a, b) => a - b)
  if (prices.length === 0) return undefined
  const round = (n: number) => Math.round(n / PRICE_ROUND) * PRICE_ROUND
  if (prices.length === 1) {
    return {
      min: round(prices[0] * (1 - SINGLE_PRICE_SPREAD)),
      max: round(prices[0] * (1 + SINGLE_PRICE_SPREAD)),
    }
  }
  const at = (ratio: number) => prices[Math.round((prices.length - 1) * ratio)]
  return { min: round(at(0.25)), max: round(at(0.75)) }
}

// 찜 목록을 브랜드, 스타일, 가격대 취향 신호로 요약
export const summarizeFavorites = (favorites: MarketProduct[]): FavoriteSignals => ({
  count: favorites.length,
  brands: topFavoriteBrands(favorites, SIGNAL_BRAND_LIMIT),
  styles: topFavoriteStyles(favorites),
  priceRange: favoritePriceRange(favorites),
})

// 자주 찜한 브랜드를 빈도순으로 추출
export const topFavoriteBrands = (favorites: MarketProduct[], limit = 3): string[] => {
  const counts = new Map<string, number>()
  for (const fav of favorites) {
    const brand = fav.brand?.trim()
    if (!brand || GENERIC_BRANDS.includes(brand)) continue
    counts.set(brand, (counts.get(brand) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([brand]) => brand)
}

// localStorage에서 찜 목록 읽기
export const loadFavorites = (): MarketProduct[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const result = favoritesSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : []
  } catch {
    return []
  }
}

// 찜 목록 저장
export const saveFavorites = (favorites: MarketProduct[]): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    // 저장 실패는 무시
  }
}
