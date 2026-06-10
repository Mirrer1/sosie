import { describe, expect, it } from 'vitest'

import { filterCatalog } from './searchCatalog'
import catalog from '@/data/catalog.json'

describe('filterCatalog', () => {
  it('카테고리 부분 일치로 매칭', () => {
    const sampleCategory = catalog[0].category
    const { products } = filterCatalog({ category: sampleCategory })

    expect(products.length).toBeGreaterThan(0)
    expect(
      products.every(
        (p) => p.category.includes(sampleCategory) || sampleCategory.includes(p.category),
      ),
    ).toBe(true)
  })

  it('키워드로 태그/이름/설명 어디든 매칭', () => {
    const sampleTag = catalog[0].tags[0]
    const { products } = filterCatalog({ keywords: [sampleTag] })

    expect(products.length).toBeGreaterThan(0)
  })

  it('가격대 필터로 범위 제한', () => {
    const { products } = filterCatalog({ priceMin: 50000, priceMax: 100000 })

    expect(products.every((p) => p.price >= 50000 && p.price <= 100000)).toBe(true)
  })

  it('매칭 없으면 빈 배열', () => {
    const { products } = filterCatalog({ keywords: ['존재하지않는키워드XYZ123'] })

    expect(products).toHaveLength(0)
  })

  it('조건 없으면 전체 카탈로그 반환', () => {
    const { products } = filterCatalog({})

    expect(products.length).toBe(catalog.length)
  })
})
