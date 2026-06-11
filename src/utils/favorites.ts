import { z } from 'zod'

import { type MarketProduct, marketProductSchema } from '@/types/product'

const STORAGE_KEY = 'sosie:favorites'
const favoritesSchema = z.array(marketProductSchema)

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
