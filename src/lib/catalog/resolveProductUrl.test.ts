import { describe, expect, it } from 'vitest'

import { isTokenFresh, pickStoreLink } from './resolveProductUrl'

const NOW = new Date('2026-09-17T09:00:00Z').getTime()

describe('isTokenFresh', () => {
  it('24시간 안에 수집한 상품이면 true', () => {
    expect(isTokenFresh('2026-09-16T18:37:00Z', NOW)).toBe(true)
  })

  it('24시간이 지났으면 false', () => {
    expect(isTokenFresh('2026-09-15T03:12:00Z', NOW)).toBe(false)
  })
})

describe('pickStoreLink', () => {
  it('상품 판매처 도메인 링크를 웹 상품 페이지로 반환', () => {
    const stores = [
      { name: '세터', link: 'https://satur.co.kr/product/1' },
      { name: '무신사', link: 'https://link.musinsa.com/app/goods/6507747?srsltid=abc' },
    ]
    expect(pickStoreLink(stores, '무신사')).toBe('https://www.musinsa.com/products/6507747')
  })

  it('판매처명이 달라도 도메인이 맞으면 반환', () => {
    const stores = [{ name: '나이키 공식 온라인스토어', link: 'https://www.nike.com/kr/t/1' }]
    expect(pickStoreLink(stores, 'Nike')).toBe('https://www.nike.com/kr/t/1')
  })

  it('상품 판매처 도메인 링크가 없으면 null', () => {
    expect(pickStoreLink([{ name: '세터', link: 'https://satur.co.kr/product/1' }], '무신사')).toBe(
      null,
    )
    expect(
      pickStoreLink([{ name: '무신사', link: 'https://www.google.com/search' }], '무신사'),
    ).toBe(null)
    expect(pickStoreLink([], '29CM')).toBe(null)
  })
})
