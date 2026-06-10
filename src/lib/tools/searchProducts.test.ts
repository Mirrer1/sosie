import { describe, expect, it } from 'vitest'

import { buildOutput, buildQuery, isMusinsa, mapNaverItem } from './searchProducts'

const SAMPLE_ITEM = {
  title: '<b>무신사 스탠다드</b> 와이드 청바지',
  link: 'https://www.musinsa.com/products/sample',
  image: 'https://shopping-phinf.pstatic.net/sample.jpg',
  lprice: '49000',
  hprice: '',
  mallName: '무신사',
  productId: 'mssss-001',
  brand: '무신사 스탠다드',
}

const SAMPLE_RESPONSE = {
  total: 3,
  display: 3,
  items: [
    SAMPLE_ITEM,
    {
      ...SAMPLE_ITEM,
      title: '쿠팡 청바지',
      link: 'https://coupang.com/x',
      mallName: '쿠팡',
      productId: 'coup-002',
      lprice: '29000',
    },
    {
      ...SAMPLE_ITEM,
      title: '무신사 다른 청바지',
      productId: 'mssss-003',
      lprice: '150000',
    },
  ],
}

describe('buildQuery', () => {
  it('기본은 무신사 키워드 자동 첨부', () => {
    expect(buildQuery({ keywords: ['청바지'] })).toBe('무신사 청바지')
  })

  it('브랜드 + 키워드 + 무신사 결합', () => {
    expect(buildQuery({ keywords: ['청바지'], brand: '무신사 스탠다드' })).toBe(
      '무신사 무신사 스탠다드 청바지',
    )
  })

  it('includeOtherMalls면 무신사 키워드 빠짐', () => {
    expect(buildQuery({ keywords: ['청바지', '와이드'], includeOtherMalls: true })).toBe(
      '청바지 와이드',
    )
  })
})

describe('isMusinsa', () => {
  it('musinsa.com 도메인 또는 mallName 무신사면 true', () => {
    expect(isMusinsa({ link: 'https://link.musinsa.com/abc' })).toBe(true)
    expect(isMusinsa({ mallName: '무신사' })).toBe(true)
    expect(isMusinsa({ link: 'https://coupang.com/x', mallName: '쿠팡' })).toBe(false)
    expect(isMusinsa({})).toBe(false)
  })
})

describe('mapNaverItem', () => {
  it('HTML 제거 + MarketProduct로 변환', () => {
    const product = mapNaverItem(SAMPLE_ITEM)

    expect(product.id).toBe('mssss-001')
    expect(product.name).toBe('무신사 스탠다드 와이드 청바지')
    expect(product.name).not.toContain('<b>')
    expect(product.price).toBe(49000)
    expect(product.mall).toBe('무신사')
    expect(product.brand).toBe('무신사 스탠다드')
  })
})

describe('buildOutput', () => {
  it('기본은 무신사 입점 상품만 반환', () => {
    const output = buildOutput(SAMPLE_RESPONSE, { keywords: ['청바지'] })

    expect(output.products).toHaveLength(2)
    expect(output.products.every((p) => p.mall.includes('무신사'))).toBe(true)
  })

  it('includeOtherMalls=true면 다른 몰도 포함', () => {
    const output = buildOutput(SAMPLE_RESPONSE, {
      keywords: ['청바지'],
      includeOtherMalls: true,
    })

    expect(output.products).toHaveLength(3)
  })

  it('가격 범위 필터 적용', () => {
    const output = buildOutput(SAMPLE_RESPONSE, {
      keywords: ['청바지'],
      includeOtherMalls: true,
      priceMin: 30000,
      priceMax: 100000,
    })

    expect(output.products.every((p) => p.price >= 30000 && p.price <= 100000)).toBe(true)
    expect(output.products).toHaveLength(1)
  })
})
