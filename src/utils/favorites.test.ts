import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadFavorites, saveFavorites, topFavoriteBrands } from './favorites'
import { type MarketProduct } from '@/types/product'

// 브랜드만 지정한 유효한 상품 객체 생성
const product = (brand: string, id = '1'): MarketProduct => ({
  id,
  brand,
  name: '샘플 상품',
  price: 50000,
  imageUrl: 'https://example.com/img.jpg',
  productUrl: 'https://example.com/p',
  mall: '무신사',
})

// localStorage를 흉내내는 인메모리 목
const createStorageMock = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  }
}

describe('topFavoriteBrands', () => {
  it('빈도순으로 정렬해 브랜드명만 반환', () => {
    const favorites = [
      product('커버낫', '1'),
      product('커버낫', '2'),
      product('무신사 스탠다드', '3'),
      product('커버낫', '4'),
    ]

    expect(topFavoriteBrands(favorites)).toEqual(['커버낫', '무신사 스탠다드'])
  })

  it('일반 브랜드 키워드는 제외', () => {
    const favorites = [product('무신사', '1'), product('브랜드 미상', '2'), product('커버낫', '3')]

    expect(topFavoriteBrands(favorites)).toEqual(['커버낫'])
  })

  it('limit 개수만큼만 반환', () => {
    const favorites = [product('A', '1'), product('B', '2'), product('C', '3'), product('D', '4')]

    expect(topFavoriteBrands(favorites, 2)).toHaveLength(2)
  })

  it('빈 목록이면 빈 배열', () => {
    expect(topFavoriteBrands([])).toEqual([])
  })
})

describe('loadFavorites / saveFavorites', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('저장한 찜 목록을 그대로 복원', () => {
    const favorites = [product('커버낫', '1'), product('무신사 스탠다드', '2')]
    saveFavorites(favorites)

    expect(loadFavorites()).toEqual(favorites)
  })

  it('저장된 값이 없으면 빈 배열', () => {
    expect(loadFavorites()).toEqual([])
  })

  it('스키마에 맞지 않는 값이면 빈 배열', () => {
    localStorage.setItem('sosie:favorites', JSON.stringify([{ brand: '커버낫' }]))

    expect(loadFavorites()).toEqual([])
  })
})
