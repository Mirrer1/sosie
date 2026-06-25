import { describe, expect, it } from 'vitest'

import {
  cleanProductName,
  extractModelCodes,
  filterRelevantSources,
  mapNaverResponse,
} from './comparePrices'

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

describe('cleanProductName', () => {
  it('대괄호 기호는 제거하되 브랜드명은 유지', () => {
    expect(cleanProductName('[노이어] 발마칸 코트')).toBe('노이어 발마칸 코트')
  })

  it('소괄호 내용(색상 등)은 제거', () => {
    expect(cleanProductName('발마칸 코트 (브라운)')).toBe('발마칸 코트')
  })

  it('모델코드는 제거', () => {
    expect(cleanProductName('오간자 발마칸 코트 N23SCT01-BR')).toBe('오간자 발마칸 코트')
  })

  it('전체 정제', () => {
    expect(cleanProductName('[노이어] 오간자 레이어드 발마칸 코트 (브라운) N23SCT01-BR')).toBe(
      '노이어 오간자 레이어드 발마칸 코트',
    )
  })
})

describe('filterRelevantSources', () => {
  const sources = [
    { seller: 'A', price: 100, url: 'https://a.com', title: '노이어 오간자 레이어드 발마칸 코트' },
    { seller: 'B', price: 90, url: 'https://b.com', title: '노이어 발마칸 코트 브라운' },
    { seller: 'C', price: 80, url: 'https://c.com', title: '무탠다드 청바지' },
  ]

  it('토큰이 충분히 겹치는 판매처만 남김', () => {
    const result = filterRelevantSources(sources, '노이어 오간자 레이어드 발마칸 코트')

    expect(result.map((s) => s.seller)).toEqual(['A', 'B'])
  })

  it('전부 걸러지면 원본 유지', () => {
    const onlyIrrelevant = [
      { seller: 'C', price: 80, url: 'https://c.com', title: '무탠다드 청바지' },
    ]
    const result = filterRelevantSources(onlyIrrelevant, '노이어 오간자 레이어드 발마칸 코트')

    expect(result).toHaveLength(1)
    expect(result[0].seller).toBe('C')
  })

  it('같은 브랜드라도 구별 단어가 부족한 다른 모델은 제외', () => {
    const product = '[더셔츠스튜디오] 아쿠아 블루 스몰체크 버튼다운 남방 TSS143'
    const sources = [
      {
        seller: '네이버',
        price: 18970,
        url: 'https://n.com',
        title: '더셔츠스튜디오 남자 루즈핏 면 체크 버튼다운 캐주얼 셔츠 남방',
      },
      {
        seller: '29CM',
        price: 21800,
        url: 'https://29.com',
        title: '[더셔츠스튜디오] 아쿠아블루 스몰체크 버튼다운 남방',
      },
      {
        seller: '네이버',
        price: 21800,
        url: 'https://n2.com',
        title: '더셔츠스튜디오 스몰체크 버튼다운 남방',
      },
    ]
    const result = filterRelevantSources(sources, product, '더셔츠스튜디오')

    expect(result.map((s) => s.seller)).toEqual(['29CM', '네이버'])
  })

  it('다른 브랜드는 brand 인자로 제외', () => {
    const sources = [
      { seller: 'A', price: 100, url: 'https://a.com', title: '노이어 발마칸 코트' },
      { seller: 'B', price: 90, url: 'https://b.com', title: '커버낫 발마칸 코트' },
    ]
    const result = filterRelevantSources(sources, '노이어 발마칸 코트', '노이어')

    expect(result.map((s) => s.seller)).toEqual(['A'])
  })
})

describe('extractModelCodes', () => {
  it('모델코드에서 색상 등 끝 글자를 떼고 핵심부만 추출', () => {
    expect(extractModelCodes('크리틱 RACING ZIP-UP KNIT NAVY CTCDDC004NV')).toEqual(['CTCDDC004'])
  })

  it('같은 제품 다른 색상은 같은 핵심부', () => {
    expect(extractModelCodes('CTCDDC004SL')).toEqual(['CTCDDC004'])
    expect(extractModelCodes('CTCDEA003BL')).toEqual(['CTCDEA003'])
  })

  it('순수 숫자(상품번호)는 모델코드 아님', () => {
    expect(extractModelCodes('크리틱 니트 1184041')).toEqual([])
  })
})

describe('filterRelevantSources - 브랜드/모델코드', () => {
  const PRODUCT = '크리틱 RACING ZIP-UP KNIT NAVY CTCDDC004NV'
  const sources = [
    {
      seller: '무신사',
      price: 103200,
      url: 'https://m.com',
      title: '크리틱 RACING ZIP-UP KNIT NAVY CTCDDC004NV',
    },
    {
      seller: 'G마켓',
      price: 78360,
      url: 'https://g.com',
      title: '크리틱 RACING ZIP-UP KNIT SKY BLUE CTCDDC004SL',
    },
    {
      seller: '무신사',
      price: 109650,
      url: 'https://m2.com',
      title: '크리틱 KWAIIIII RACING ZIP-UP KNIT BLUE CTCDEA003BL',
    },
    {
      seller: '타브랜드',
      price: 50000,
      url: 'https://x.com',
      title: '무탠다드 RACING ZIP-UP KNIT',
    },
  ]

  it('다른 모델코드(KWAIIIII)와 타브랜드는 제외, 같은 코드/색상위는 유지', () => {
    const result = filterRelevantSources(sources, PRODUCT)

    expect(result.map((s) => s.title)).toEqual([
      '크리틱 RACING ZIP-UP KNIT NAVY CTCDDC004NV',
      '크리틱 RACING ZIP-UP KNIT SKY BLUE CTCDDC004SL',
    ])
  })

  it('브랜드명이 없으면 제외', () => {
    const mixed = [
      {
        seller: '무신사',
        price: 103200,
        url: 'https://m.com',
        title: '크리틱 RACING ZIP-UP KNIT NAVY CTCDDC004NV',
      },
      { seller: 'X', price: 1, url: 'https://x.com', title: 'RACING ZIP-UP KNIT NAVY CTCDDC004NV' },
    ]
    const result = filterRelevantSources(mixed, PRODUCT)

    expect(result.map((s) => s.seller)).toEqual(['무신사'])
  })
})
