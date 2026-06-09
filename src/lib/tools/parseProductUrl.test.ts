import { describe, expect, it } from 'vitest'

import { mapOgResult } from './parseProductUrl'

describe('mapOgResult', () => {
  it('정상 OG 응답 매핑', () => {
    const result = mapOgResult(
      {
        ogTitle: '유니폼브릿지 발마칸 코트',
        ogImage: [{ url: 'https://image.musinsa.com/cover.jpg' }],
        ogDescription: '캐멀톤 오버핏',
        ogSiteName: 'MUSINSA',
      },
      'https://www.musinsa.com/products/12345',
    )

    expect(result.title).toBe('유니폼브릿지 발마칸 코트')
    expect(result.imageUrl).toBe('https://image.musinsa.com/cover.jpg')
    expect(result.description).toBe('캐멀톤 오버핏')
    expect(result.siteName).toBe('MUSINSA')
    expect(result.sourceUrl).toBe('https://www.musinsa.com/products/12345')
  })

  it('ogTitle 없으면 기본 fallback', () => {
    const result = mapOgResult({}, 'https://example.com')

    expect(result.title).toBe('제목 없음')
  })

  it('이미지 없으면 imageUrl undefined', () => {
    const result = mapOgResult({ ogTitle: '상품' }, 'https://example.com/product/1')

    expect(result.imageUrl).toBeUndefined()
  })

  it('이미지가 여러 개면 첫 번째만 사용', () => {
    const result = mapOgResult(
      {
        ogTitle: '상품',
        ogImage: [{ url: 'https://example.com/1.jpg' }, { url: 'https://example.com/2.jpg' }],
      },
      'https://example.com/p',
    )

    expect(result.imageUrl).toBe('https://example.com/1.jpg')
  })
})
