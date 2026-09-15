import { describe, expect, it } from 'vitest'

import { buildMatchReasons, favoritesForReason } from './matchReasons'
import { type MarketProduct } from '@/types/product'

const PRODUCT: MarketProduct = {
  id: '1',
  brand: '커버낫',
  name: '어센틱 맨투맨',
  price: 49000,
  imageUrl: 'https://example.com/img.jpg',
  productUrl: '/go/1',
  mall: '무신사',
  styles: ['캐주얼', '스트릿'],
}

const FAVORITES = { count: 3, brands: ['커버낫'], styles: ['스트릿'] }

describe('favoritesForReason', () => {
  const FAVS: MarketProduct[] = [
    { ...PRODUCT, id: 'a', brand: '커버낫', styles: ['캐주얼'], price: 30000 },
    { ...PRODUCT, id: 'b', brand: '앤더슨벨', styles: ['스트릿'], price: 90000 },
    { ...PRODUCT, id: '1' },
  ]

  it('찜 브랜드 이유는 같은 브랜드 찜만 반환하고 보고 있는 상품은 제외', () => {
    expect(favoritesForReason({ key: 'favoriteBrand' }, PRODUCT, FAVS).map((f) => f.id)).toEqual([
      'a',
    ])
  })

  it('찜 스타일 이유는 그 스타일을 가진 찜만 반환', () => {
    const result = favoritesForReason({ key: 'favoriteStyle', value: '스트릿' }, PRODUCT, FAVS)

    expect(result.map((f) => f.id)).toEqual(['b'])
  })

  it('찜 가격대 이유는 가격대 안의 찜만 반환', () => {
    const result = favoritesForReason({ key: 'favoritePrice' }, PRODUCT, FAVS, {
      min: 20000,
      max: 50000,
    })

    expect(result.map((f) => f.id)).toEqual(['a'])
  })

  it('프로필 이유는 빈 배열', () => {
    expect(favoritesForReason({ key: 'budget' }, PRODUCT, FAVS)).toEqual([])
  })
})

describe('buildMatchReasons', () => {
  it('프로필 스타일, 예산, 브랜드 순으로 맞는 이유를 추출', () => {
    const reasons = buildMatchReasons(PRODUCT, {
      styles: ['캐주얼'],
      brands: ['커버낫'],
      budget: { max: 50000 },
    })

    expect(reasons).toEqual([
      { key: 'style', value: '캐주얼' },
      { key: 'budget' },
      { key: 'brand' },
    ])
  })

  it('프로필 성별과 정확히 같은 성별 상품이면 이유로 추가하고 공용은 제외', () => {
    expect(buildMatchReasons({ ...PRODUCT, gender: '남성' }, { gender: '남성' })).toEqual([
      { key: 'gender', value: '남성' },
    ])
    expect(buildMatchReasons({ ...PRODUCT, gender: '공용' }, { gender: '남성' })).toEqual([])
  })

  it('프로필 이유와 찜 이유가 모두 있으면 프로필 이유를 먼저 채움', () => {
    const reasons = buildMatchReasons(
      { ...PRODUCT, gender: '남성' },
      { styles: ['캐주얼'], budget: { max: 50000 }, gender: '남성' },
      { ...FAVORITES, priceRange: { min: 40000, max: 60000 } },
    )

    expect(reasons).toEqual([
      { key: 'style', value: '캐주얼' },
      { key: 'budget' },
      { key: 'gender', value: '남성' },
    ])
  })

  it('프로필과 같은 브랜드나 스타일은 찜 이유로 중복 표시하지 않음', () => {
    const reasons = buildMatchReasons(
      PRODUCT,
      { styles: ['스트릿'], brands: ['커버낫'] },
      FAVORITES,
    )

    expect(reasons).toEqual([{ key: 'style', value: '스트릿' }, { key: 'brand' }])
  })

  it('예산을 넘거나 예산이 없으면 예산 이유는 제외', () => {
    expect(buildMatchReasons(PRODUCT, { budget: { max: 30000 } })).toEqual([])
    expect(buildMatchReasons(PRODUCT, {})).toEqual([])
  })

  it('찜 브랜드와 프로필과 다른 찜 스타일도 이유로 추가', () => {
    const reasons = buildMatchReasons(PRODUCT, { styles: ['캐주얼'] }, FAVORITES)

    expect(reasons).toEqual([
      { key: 'style', value: '캐주얼' },
      { key: 'favoriteBrand' },
      { key: 'favoriteStyle', value: '스트릿' },
    ])
  })

  it('예산이 없으면 찜 가격대 안인지도 이유로 추가', () => {
    const reasons = buildMatchReasons(PRODUCT, null, {
      count: 1,
      brands: [],
      styles: [],
      priceRange: { min: 40000, max: 60000 },
    })

    expect(reasons).toEqual([{ key: 'favoritePrice' }])
  })

  it('최대 3개까지만 반환', () => {
    const reasons = buildMatchReasons(
      PRODUCT,
      { styles: ['캐주얼'], brands: ['커버낫'], budget: { max: 50000 } },
      FAVORITES,
    )

    expect(reasons).toHaveLength(3)
  })
})
