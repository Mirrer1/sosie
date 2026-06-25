import { z } from 'zod'

import { type MarketProduct, marketProductSchema } from '@/types/product'

const STORAGE_KEY = 'sosie:favorites'
const favoritesSchema = z.array(marketProductSchema)
const GENERIC_BRANDS = ['무신사', '브랜드 미상', '판매처 미상']

// 찜 목록에서 자주 찜한 브랜드를 빈도순으로 추출
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
