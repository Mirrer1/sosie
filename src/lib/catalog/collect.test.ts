import { describe, expect, it } from 'vitest'

import { buildSearchText, isNoiseTitle, mapShoppingResult, shouldStore } from './collect'
import { type ProductTag } from '@/lib/catalog/tagProducts'

const SAMPLE_RESULT = {
  product_id: '7262978449828335436',
  title: '커버낫COVERNAT 스몰 어센틱 맨투맨 Oatmeal',
  extracted_price: 49000,
  thumbnail: 'https://encrypted-tbn1.gstatic.com/shopping?q=sample',
  source: 'MUSINSA',
  product_link: 'https://www.google.co.kr/search?ibp=oshop',
  immersive_product_page_token: 'token',
}

const SAMPLE_TAG: ProductTag = {
  isFashion: true,
  brand: '커버낫',
  name: '스몰 어센틱 맨투맨 Oatmeal',
  category: '상의',
  subcategory: '맨투맨',
  gender: '공용',
  colors: ['오트밀'],
  materials: ['면'],
  styles: ['캐주얼'],
  keywords: ['스웨트셔츠', '가을 맨투맨'],
}

describe('mapShoppingResult', () => {
  it('구글 쇼핑 결과를 수집 항목으로 변환하고 판매처명 정규화', () => {
    expect(mapShoppingResult(SAMPLE_RESULT)).toEqual({
      id: '7262978449828335436',
      title: '커버낫COVERNAT 스몰 어센틱 맨투맨 Oatmeal',
      price: 49000,
      imageUrl: SAMPLE_RESULT.thumbnail,
      mall: '무신사',
      productLink: SAMPLE_RESULT.product_link,
      immersiveToken: 'token',
    })
  })

  it('필수 필드가 없거나 가격이 0이면 제외', () => {
    expect(mapShoppingResult({ ...SAMPLE_RESULT, thumbnail: undefined })).toBeNull()
    expect(mapShoppingResult({ ...SAMPLE_RESULT, extracted_price: 0 })).toBeNull()
  })
})

describe('isNoiseTitle', () => {
  it('중고와 도매 같은 단어가 있으면 true', () => {
    expect(isNoiseTitle('나이키 운동화 중고')).toBe(true)
    expect(isNoiseTitle('나이키 운동화')).toBe(false)
  })
})

describe('shouldStore', () => {
  const item = mapShoppingResult(SAMPLE_RESULT)!

  it('지원 판매처의 패션 상품이면 저장', () => {
    expect(shouldStore(item, SAMPLE_TAG)).toBe(true)
  })

  it('패션 상품이 아니거나 노이즈 단어가 있으면 제외', () => {
    expect(shouldStore(item, { ...SAMPLE_TAG, isFashion: false })).toBe(false)
    expect(shouldStore({ ...item, title: `${item.title} 중고` }, SAMPLE_TAG)).toBe(false)
  })

  it('등록한 판매처만 저장하고 중고 플랫폼은 제외', () => {
    expect(shouldStore({ ...item, mall: '29CM' }, SAMPLE_TAG)).toBe(true)
    expect(shouldStore({ ...item, mall: '후루츠패밀리' }, SAMPLE_TAG)).toBe(false)
  })
})

describe('buildSearchText', () => {
  it('브랜드와 태그를 모아 공백 없는 소문자로 정규화', () => {
    const text = buildSearchText(mapShoppingResult(SAMPLE_RESULT)!, SAMPLE_TAG)

    expect(text).toContain('커버낫covernat')
    expect(text).toContain('가을맨투맨')
    expect(text).toContain('캐주얼')
    expect(text).not.toContain(' ')
  })
})
