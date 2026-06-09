import { describe, expect, it } from 'vitest'

import { filterCatalog } from './searchCatalog'

describe('filterCatalog', () => {
  it('카테고리 부분 일치로 매칭', () => {
    const { products } = filterCatalog({ category: '발마칸' })

    expect(products).toHaveLength(1)
    expect(products[0].brand).toBe('유니폼브릿지')
  })

  it('키워드로 태그/이름/설명 어디든 매칭', () => {
    const { products } = filterCatalog({ keywords: ['오버핏'] })

    expect(products.length).toBeGreaterThan(0)
    expect(products.every((p) => p.tags.includes('오버핏'))).toBe(true)
  })

  it('가격대 필터로 범위 제한', () => {
    const { products } = filterCatalog({ priceMin: 100000, priceMax: 200000 })

    expect(products.every((p) => p.price >= 100000 && p.price <= 200000)).toBe(true)
  })

  it('매칭 없으면 빈 배열', () => {
    const { products } = filterCatalog({ keywords: ['존재하지않는키워드XYZ'] })

    expect(products).toHaveLength(0)
  })

  it('조건 없으면 전체 카탈로그 반환', () => {
    const { products } = filterCatalog({})

    expect(products.length).toBeGreaterThan(0)
  })
})
