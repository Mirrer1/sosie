'use client'

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { type MarketProduct } from '@/types/product'
import { loadFavorites, saveFavorites } from '@/utils/favorites'

type FavoritesContextValue = {
  favorites: MarketProduct[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (product: MarketProduct) => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

// 찜 상태를 앱 전역에 제공
const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<MarketProduct[]>([])

  // 마운트 시 localStorage에서 찜 복원
  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  const isFavorite = (id: string) => favorites.some((p) => p.id === id)

  // 찜 추가/제거 토글 후 저장
  const toggleFavorite = (product: MarketProduct) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id)
      const next = exists ? prev.filter((p) => p.id !== product.id) : [product, ...prev]
      saveFavorites(next)
      return next
    })
  }

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export default FavoritesProvider

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites는 FavoritesProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
