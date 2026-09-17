import { describe, expect, it } from 'vitest'

import {
  hasConflictingTitleWord,
  isTokenFresh,
  pickSearchResultLink,
  pickStoreLink,
  scoreProductTitle,
} from './resolveProductUrl'

const PRODUCT = { brand: '시스에이', name: '울 블랜딩 니트 후드 집업 [black]', mall: '무신사' }

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

describe('hasConflictingTitleWord', () => {
  const product = {
    brand: '슈가포인트',
    name: '남성 그래픽 반팔 면 티셔츠. Nori-Pink',
    title: '슈가포인트SUGAPOINT 남성 그래픽 반팔 면 티셔츠. Nori-Pink',
    mall: '무신사',
  }

  it('상품에 없는 영문 이름이 있으면 true', () => {
    expect(
      hasConflictingTitleWord(
        '슈가포인트(SUGAPOINT) 남성/여성 그래픽 반팔 면 티셔츠. Pride Prove',
        product,
      ),
    ).toBe(true)
  })

  it('같은 영문 이름이거나 괄호 속 브랜드 표기와 색상 영문만 있으면 false', () => {
    expect(
      hasConflictingTitleWord(
        '슈가포인트(SUGAPOINT) 남성 그래픽 반팔 면 티셔츠. Nori-Pink',
        product,
      ),
    ).toBe(false)
    expect(hasConflictingTitleWord('슈가포인트 남성 그래픽 반팔 면 티셔츠 BLACK', product)).toBe(
      false,
    )
  })
})

describe('scoreProductTitle', () => {
  it('제목에서 맞은 상품명 단어는 2점으로 계산', () => {
    expect(scoreProductTitle('시스에이(SIS A) 울 블랜딩 니트 후드 집업 [black]', PRODUCT)).toBe(8)
  })

  it('다른 상품 제목이면 0', () => {
    expect(scoreProductTitle('시스에이(SIS A) 코튼 반팔티', PRODUCT)).toBe(0)
    expect(scoreProductTitle('시스에이 울 니트 반팔티', PRODUCT)).toBe(0)
  })
})

describe('pickSearchResultLink', () => {
  it('판매처 상품 페이지이고 제목이 맞는 첫 링크를 웹 상품 페이지로 반환', () => {
    const results = [
      { link: 'https://www.musinsa.com/search/goods?keyword=니트', title: '울 블랜딩 니트 검색' },
      { link: 'https://www.29cm.co.kr/products/1', title: '울 블랜딩 니트 후드 집업' },
      {
        link: 'https://www.musinsa.com/app/goods/4421884',
        title: '시스에이 울 블랜딩 니트 후드 집업',
      },
    ]
    expect(pickSearchResultLink(results, PRODUCT)).toBe('https://www.musinsa.com/products/4421884')
  })

  it('여러 결과 중 상품명이 가장 많이 맞는 링크를 선택', () => {
    const product = {
      brand: '다이나핏',
      name: 'PACER (페이서) 여성 크롭 반팔티_Sky Blue',
      mall: '무신사',
    }
    const results = [
      {
        link: 'https://www.musinsa.com/products/1',
        title: '다이나핏 PACER (페이서) 여성 크롭 반팔티',
      },
      {
        link: 'https://www.musinsa.com/products/2',
        title: '다이나핏 PACER (페이서) 여성 크롭 반팔티_Sky ...',
      },
      {
        link: 'https://www.musinsa.com/products/3',
        title: '다이나핏 A.B.T (에이비티) 여성 반팔티',
      },
    ]
    expect(pickSearchResultLink(results, product)).toBe('https://www.musinsa.com/products/2')
  })

  it('제목이 잘려 구분 이름이 없는 결과는 버리고 구분 이름이 있는 결과를 선택', () => {
    const product = {
      brand: '슈가포인트',
      name: '남성 그래픽 반팔 면 티셔츠. Nori-Pink',
      title: '슈가포인트SUGAPOINT 남성 그래픽 반팔 면 티셔츠. Nori-Pink',
      mall: '무신사',
    }
    const results = [
      {
        link: 'https://www.musinsa.com/products/4055619',
        title: '슈가포인트(SUGAPOINT) 남성/여성 그래픽 반팔 면 티셔츠. ...',
      },
      {
        link: 'https://www.musinsa.com/products/4106013',
        title: '슈가포인트(SUGAPOINT) 남성 그래픽 반팔 면 티셔츠. Nori ...',
      },
    ]
    expect(pickSearchResultLink(results, product)).toBe('https://www.musinsa.com/products/4106013')
    expect(pickSearchResultLink(results.slice(0, 1), product)).toBe(null)
  })

  it('제목이 같게 잘려 있으면 요약에 색상까지 맞는 결과를 선택', () => {
    const product = {
      brand: '슈가포인트',
      name: '남성 그래픽 반팔 면 티셔츠. Nori-Pink',
      mall: '무신사',
    }
    const title = '슈가포인트(SUGAPOINT) 남성 그래픽 반팔 면 티셔츠. Nori ...'
    const results = [
      {
        link: 'https://www.musinsa.com/products/4106013',
        title,
        snippet: '제품 : 남성 그래픽 반팔 면 티셔츠. Nori-White - 17500.',
      },
      {
        link: 'https://www.musinsa.com/products/4105940',
        title,
        snippet: 'Nori-Pink. 슈가포인트 · 상의 · 남성 그래픽 반팔 면 티셔츠. Nori-Pink.',
      },
    ]
    expect(pickSearchResultLink(results, product)).toBe('https://www.musinsa.com/products/4105940')
  })

  it('상품 상세가 아닌 판매처 페이지는 버리고 goodsNo 주소는 상품 페이지로 변환', () => {
    const results = [
      {
        link: 'https://www.musinsa.com/curator/goods/abc',
        title: '시스에이 울 블랜딩 니트 후드 집업',
      },
      {
        link: 'https://www.musinsa.com/snap/goods?goodsNo=4421884',
        title: '시스에이 울 블랜딩 니트 후드 집업',
      },
    ]
    expect(pickSearchResultLink(results, PRODUCT)).toBe('https://www.musinsa.com/products/4421884')
  })

  it('맞는 결과가 없으면 null', () => {
    const results = [{ link: 'https://www.musinsa.com/products/1', title: '시스에이 코튼 반팔티' }]
    expect(pickSearchResultLink(results, PRODUCT)).toBe(null)
    expect(pickSearchResultLink([], PRODUCT)).toBe(null)
  })
})

describe('pickSearchResultLink 동점 방지', () => {
  const product = {
    brand: '블랙야크',
    name: 'ZERO 남성 카고 반바지_BK',
    title: '블랙야크BLACKYAK ZERO 남성 카고 반바지_BK',
    mall: '무신사',
  }

  it('요약에서만 맞은 다른 상품보다 제목이 맞는 상품을 선택하고 후기와 추천 페이지는 제외', () => {
    const results = [
      {
        link: 'https://www.musinsa.com/recommend/similar?goodsNo=4965266',
        title: '무신사 추천 상품',
        snippet: 'ZERO 남성 카고 반바지_BK',
      },
      {
        link: 'https://www.musinsa.com/products/3990224',
        title: '블랙야크(BLACKYAK) ZERO카고5팬츠#1_BK - 사이즈 & 후기',
        snippet: '남성전용 카고 반바지입니다.',
      },
      {
        link: 'https://www.musinsa.com/review/goods/4983630',
        title: '블랙야크 (blackyak) ZERO 남성 카고 반바지_BK 전체 후기',
      },
      {
        link: 'https://www.musinsa.com/products/4983630',
        title: '블랙야크(BLACKYAK) ZERO 남성 카고 반바지_BK - 사이즈 ...',
      },
    ]
    expect(pickSearchResultLink(results, product)).toBe('https://www.musinsa.com/products/4983630')
  })
})
