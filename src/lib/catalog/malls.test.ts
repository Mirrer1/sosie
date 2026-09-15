import { describe, expect, it } from 'vitest'

import { isMusinsaMall, isTrustedMall, normalizeMall, toWebProductUrl } from './malls'

describe('normalizeMall', () => {
  it('판매처 표기를 대표 이름으로 묶음', () => {
    expect(normalizeMall('29cm')).toBe('29CM')
    expect(normalizeMall('ABC마트 그랜드스테이지 온라인몰')).toBe('ABC마트')
    expect(normalizeMall('nike.com')).toBe('Nike')
  })

  it('규칙에 없으면 공백만 정리', () => {
    expect(normalizeMall(' 후아유닷컴 ')).toBe('후아유닷컴')
  })
})

describe('isMusinsaMall', () => {
  it('무신사 표기면 true', () => {
    expect(isMusinsaMall('무신사')).toBe(true)
    expect(isMusinsaMall('MUSINSA')).toBe(true)
    expect(isMusinsaMall('29cm')).toBe(false)
  })
})

describe('isTrustedMall', () => {
  it('고정 신뢰 목록만 true', () => {
    expect(isTrustedMall('29cm')).toBe(true)
    expect(isTrustedMall('Goodwearmall')).toBe(false)
  })
})

describe('toWebProductUrl', () => {
  it('무신사 앱 링크를 웹 상품 페이지로 변환', () => {
    expect(toWebProductUrl('https://link.musinsa.com/app/goods/2208663?srsltid=abc')).toBe(
      'https://www.musinsa.com/products/2208663',
    )
  })

  it('다른 몰 링크는 추적 파라미터만 제거', () => {
    expect(toWebProductUrl('https://www.kolonmall.com/Product/K1?srsltid=abc&x=1')).toBe(
      'https://www.kolonmall.com/Product/K1?x=1',
    )
  })

  it('잘못된 주소는 그대로 반환', () => {
    expect(toWebProductUrl('not-a-url')).toBe('not-a-url')
  })
})
