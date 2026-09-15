import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  favoritePriceRange,
  loadFavorites,
  saveFavorites,
  summarizeFavorites,
  topFavoriteBrands,
  topFavoriteStyles,
} from './favorites'
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

describe('topFavoriteStyles', () => {
  it('찜이 3개 이상이면 두 번 이상 나온 스타일만 빈도순으로 반환', () => {
    const favorites = [
      { ...product('A', '1'), styles: ['스트릿', '캐주얼'] },
      { ...product('B', '2'), styles: ['스트릿'] },
      { ...product('C', '3'), styles: ['빈티지', '캐주얼'] },
      { ...product('D', '4'), styles: ['스트릿', '미니멀'] },
    ]

    expect(topFavoriteStyles(favorites)).toEqual(['스트릿', '캐주얼'])
  })

  it('찜이 2개 이하면 한 번만 나온 스타일도 바로 반영', () => {
    expect(topFavoriteStyles([{ ...product('A', '1'), styles: ['빈티지'] }])).toEqual(['빈티지'])
  })

  it('스타일 태그가 없는 옛 찜은 무시', () => {
    expect(topFavoriteStyles([product('A', '1'), product('B', '2')])).toEqual([])
  })
})

describe('favoritePriceRange', () => {
  it('가격의 하위 25%와 상위 25% 지점을 천 원 단위로 반환', () => {
    const favorites = [10000, 30000, 50000, 70000, 90000].map((price, i) => ({
      ...product('A', String(i)),
      price,
    }))

    expect(favoritePriceRange(favorites)).toEqual({ min: 30000, max: 70000 })
  })

  it('찜이 하나면 그 가격 앞뒤 30%를 가격대로 반환', () => {
    expect(favoritePriceRange([product('A', '1')])).toEqual({ min: 35000, max: 65000 })
  })

  it('찜이 없으면 가격대 없음', () => {
    expect(favoritePriceRange([])).toBeUndefined()
  })
})

describe('summarizeFavorites', () => {
  it('개수와 브랜드, 스타일, 가격대를 함께 요약', () => {
    const favorites = [
      { ...product('커버낫', '1'), styles: ['캐주얼'], price: 40000 },
      { ...product('커버낫', '2'), styles: ['캐주얼'], price: 60000 },
    ]

    expect(summarizeFavorites(favorites)).toEqual({
      count: 2,
      brands: ['커버낫'],
      styles: ['캐주얼'],
      priceRange: { min: 40000, max: 60000 },
    })
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
