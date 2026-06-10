import { describe, expect, it } from 'vitest'

import { mapNaverResponse } from './comparePrices'

const SAMPLE_RESPONSE = {
  total: 2,
  display: 2,
  items: [
    {
      title: '<b>유니폼브릿지</b> 발마칸 코트',
      link: 'https://www.musinsa.com/products/sample-1',
      image: 'https://shopping-phinf.pstatic.net/sample-1.jpg',
      lprice: '168000',
      hprice: '',
      mallName: '무신사',
      productId: '1',
      brand: '유니폼브릿지',
    },
    {
      title: '유니폼브릿지 <b>발마칸</b> 코트 (공식몰)',
      link: 'https://uniformbridge.com/products/sample-2',
      image: '',
      lprice: '150000',
      hprice: '',
      mallName: '유니폼브릿지 공식몰',
      productId: '2',
      brand: '유니폼브릿지',
    },
  ],
}

const PRODUCT_NAME = '유니폼브릿지 발마칸 코트'

describe('mapNaverResponse', () => {
  it('네이버 응답을 Sosie 스키마로 변환', () => {
    const result = mapNaverResponse(SAMPLE_RESPONSE, PRODUCT_NAME)

    expect(result.sources).toHaveLength(2)
    expect(result.sources[0].seller).toBe('무신사')
    expect(result.sources[0].price).toBe(168000)
  })

  it('HTML 태그 제거', () => {
    const result = mapNaverResponse(SAMPLE_RESPONSE, PRODUCT_NAME)

    expect(result.sources[0].title).toBe('유니폼브릿지 발마칸 코트')
    expect(result.sources[1].title).toBe('유니폼브릿지 발마칸 코트 (공식몰)')
    expect(result.sources[0].title).not.toContain('<b>')
  })

  it('빈 이미지는 undefined로 변환', () => {
    const result = mapNaverResponse(SAMPLE_RESPONSE, PRODUCT_NAME)

    expect(result.sources[0].imageUrl).toBe('https://shopping-phinf.pstatic.net/sample-1.jpg')
    expect(result.sources[1].imageUrl).toBeUndefined()
  })

  it('빈 items 배열은 빈 sources', () => {
    const result = mapNaverResponse({ total: 0, display: 0, items: [] }, PRODUCT_NAME)

    expect(result.sources).toHaveLength(0)
  })

  it('외부 mall 도메인은 link 그대로 유지', () => {
    const result = mapNaverResponse(SAMPLE_RESPONSE, PRODUCT_NAME)

    expect(result.sources[0].url).toBe('https://www.musinsa.com/products/sample-1')
    expect(result.sources[1].url).toBe('https://uniformbridge.com/products/sample-2')
  })

  it('네이버 쇼핑 도메인은 검색 페이지로 우회', () => {
    const response = {
      total: 1,
      display: 1,
      items: [
        {
          title: '발마칸',
          link: 'https://search.shopping.naver.com/catalog/12345',
          image: '',
          lprice: '100000',
          hprice: '',
          mallName: '무신사',
          productId: '1',
        },
      ],
    }
    const result = mapNaverResponse(response, PRODUCT_NAME)

    expect(result.sources[0].url).toContain('https://search.shopping.naver.com/search/all')
    expect(result.sources[0].url).toContain(encodeURIComponent('유니폼브릿지 발마칸 코트 무신사'))
  })
})
