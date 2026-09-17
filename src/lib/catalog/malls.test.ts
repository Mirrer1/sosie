import { describe, expect, it } from 'vitest'

import {
  buildMallSearchUrl,
  buildSearchKeyword,
  isMallUrl,
  isMusinsaMall,
  isSupportedMall,
  normalizeMall,
  toWebProductUrl,
} from './malls'

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

describe('isSupportedMall', () => {
  it('검색 주소를 등록한 판매처면 true', () => {
    expect(isSupportedMall('MUSINSA')).toBe(true)
    expect(isSupportedMall('ABC마트 그랜드스테이지 온라인몰')).toBe(true)
    expect(isSupportedMall('Stand oil')).toBe(true)
  })

  it('중고 플랫폼과 등록 밖 판매처는 false', () => {
    expect(isSupportedMall('후루츠패밀리')).toBe(false)
    expect(isSupportedMall('Goodwearmall')).toBe(false)
  })
})

describe('isMallUrl', () => {
  it('판매처 도메인 링크면 true', () => {
    expect(isMallUrl('https://www.musinsa.com/products/1010304', '무신사')).toBe(true)
    expect(isMallUrl('https://www.nike.com/kr/t/1', 'Nike')).toBe(true)
  })

  it('다른 도메인이나 등록 밖 판매처면 false', () => {
    expect(isMallUrl('https://satur.co.kr/product/1', '무신사')).toBe(false)
    expect(isMallUrl('https://fakemusinsa.com/products/1', '무신사')).toBe(false)
    expect(isMallUrl('https://www.musinsa.com/products/1', 'Nike')).toBe(false)
    expect(isMallUrl('https://goodwearmall.com/1', 'Goodwearmall')).toBe(false)
    expect(isMallUrl('not-a-url', '무신사')).toBe(false)
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

describe('buildSearchKeyword', () => {
  it('괄호 표기와 구분 기호를 빼고 브랜드를 앞에 붙임', () => {
    expect(
      buildSearchKeyword({
        brand: '뉴발란스',
        name: 'NBNEG21503 / UNI NB 프렌즈 반팔티 (LIGTH GRAY)',
        mall: '무신사',
      }),
    ).toBe('뉴발란스 NBNEG21503 UNI NB 프렌즈 반팔티')
  })

  it('색상 수 표기를 빼고 앞 6단어만 남김', () => {
    expect(
      buildSearchKeyword({
        brand: '마인드브릿지',
        name: '이지케어 원피스 드레스 셔츠 8color MADS0100 오버핏',
        mall: '무신사',
      }),
    ).toBe('마인드브릿지 이지케어 원피스 드레스 셔츠 MADS0100')
  })

  it('브랜드가 판매처명이거나 상품명에 있으면 붙이지 않음', () => {
    expect(
      buildSearchKeyword({ brand: '무신사', name: '레이어드 집업 후드', mall: '무신사' }),
    ).toBe('레이어드 집업 후드')
    expect(buildSearchKeyword({ brand: '세터', name: '세터', mall: '무신사' })).toBe('세터')
  })

  it('글자나 숫자가 없는 기호 단어는 제외', () => {
    expect(
      buildSearchKeyword({ brand: 'Brooklyn', name: 'Newtro Wide - Blue', mall: '무신사' }),
    ).toBe('Brooklyn Newtro Wide Blue')
  })

  it('상품명이 비면 브랜드로 대체', () => {
    expect(buildSearchKeyword({ brand: '토피', name: '(BLACK)', mall: '무신사' })).toBe('토피')
  })
})

describe('buildMallSearchUrl', () => {
  it('무신사 상품은 무신사 검색으로 연결', () => {
    expect(buildMallSearchUrl({ brand: '토피', name: '와이드 팬츠', mall: '무신사' })).toBe(
      `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent('토피 와이드 팬츠')}`,
    )
  })

  it('다른 판매처 상품은 그 판매처 검색으로 연결', () => {
    expect(buildMallSearchUrl({ brand: '나이키', name: '에어 포스 1', mall: 'Nike' })).toBe(
      `https://www.nike.com/kr/w?q=${encodeURIComponent('나이키 에어 포스 1')}`,
    )
  })

  it('등록 밖 판매처 상품은 무신사 검색으로 연결', () => {
    expect(buildMallSearchUrl({ brand: '노스페이스', name: '눕시', mall: '후루츠패밀리' })).toBe(
      `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent('노스페이스 눕시')}`,
    )
  })
})
