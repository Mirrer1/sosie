import { describe, expect, it } from 'vitest'

import {
  cleanProductName,
  extractModelCodes,
  filterRelevantSources,
  mapRowToSource,
  pickCheapestPerSeller,
} from './comparePrices'
import { type ProductRow } from '@/types/catalog'

describe('mapRowToSource', () => {
  it('DB 행을 판매처 항목으로 변환하고 링크는 직링크 이동 경로로 연결', () => {
    const source = mapRowToSource({
      id: 'g/1',
      brand: '유니폼브릿지',
      name: '발마칸 코트',
      price: 168000,
      mall: '29CM',
      image_url: 'https://encrypted-tbn1.gstatic.com/shopping?q=sample',
    } as ProductRow)

    expect(source).toEqual({
      seller: '29CM',
      price: 168000,
      url: '/go/g%2F1',
      imageUrl: 'https://encrypted-tbn1.gstatic.com/shopping?q=sample',
      title: '유니폼브릿지 발마칸 코트',
    })
  })
})

describe('pickCheapestPerSeller', () => {
  it('판매처마다 가장 싼 항목만 남김', () => {
    const result = pickCheapestPerSeller([
      { seller: '무신사', price: 50000, url: '/go/1' },
      { seller: '29CM', price: 48000, url: '/go/2' },
      { seller: '무신사', price: 45000, url: '/go/3' },
    ])

    expect(result).toEqual([
      { seller: '무신사', price: 45000, url: '/go/3' },
      { seller: '29CM', price: 48000, url: '/go/2' },
    ])
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
    { seller: 'A', price: 100, url: '/go/a', title: '노이어 오간자 레이어드 발마칸 코트' },
    { seller: 'B', price: 90, url: '/go/b', title: '노이어 발마칸 코트 브라운' },
    { seller: 'C', price: 80, url: '/go/c', title: '무탠다드 청바지' },
  ]

  it('토큰이 충분히 겹치는 판매처만 남김', () => {
    const result = filterRelevantSources(sources, '노이어 오간자 레이어드 발마칸 코트')

    expect(result.map((s) => s.seller)).toEqual(['A', 'B'])
  })

  it('전부 걸러지면 빈 배열', () => {
    const onlyIrrelevant = [{ seller: 'C', price: 80, url: '/go/c', title: '무탠다드 청바지' }]

    expect(filterRelevantSources(onlyIrrelevant, '노이어 오간자 레이어드 발마칸 코트')).toEqual([])
  })

  it('같은 브랜드라도 구별 단어가 부족한 다른 모델은 제외', () => {
    const product = '[더셔츠스튜디오] 아쿠아 블루 스몰체크 버튼다운 남방 TSS143'
    const candidates = [
      {
        seller: '코오롱몰',
        price: 18970,
        url: '/go/n',
        title: '더셔츠스튜디오 남자 루즈핏 면 체크 버튼다운 캐주얼 셔츠 남방',
      },
      {
        seller: '29CM',
        price: 21800,
        url: '/go/29',
        title: '[더셔츠스튜디오] 아쿠아블루 스몰체크 버튼다운 남방',
      },
      {
        seller: 'W컨셉',
        price: 21800,
        url: '/go/w',
        title: '더셔츠스튜디오 스몰체크 버튼다운 남방',
      },
    ]
    const result = filterRelevantSources(candidates, product, '더셔츠스튜디오')

    expect(result.map((s) => s.seller)).toEqual(['29CM', 'W컨셉'])
  })

  it('다른 브랜드는 brand 인자로 제외', () => {
    const candidates = [
      { seller: 'A', price: 100, url: '/go/a', title: '노이어 발마칸 코트' },
      { seller: 'B', price: 90, url: '/go/b', title: '커버낫 발마칸 코트' },
    ]
    const result = filterRelevantSources(candidates, '노이어 발마칸 코트', '노이어')

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
      url: '/go/m',
      title: '크리틱 RACING ZIP-UP KNIT NAVY CTCDDC004NV',
    },
    {
      seller: '29CM',
      price: 78360,
      url: '/go/29',
      title: '크리틱 RACING ZIP-UP KNIT SKY BLUE CTCDDC004SL',
    },
    {
      seller: '무신사',
      price: 109650,
      url: '/go/m2',
      title: '크리틱 KWAIIIII RACING ZIP-UP KNIT BLUE CTCDEA003BL',
    },
    {
      seller: '타브랜드',
      price: 50000,
      url: '/go/x',
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
        url: '/go/m',
        title: '크리틱 RACING ZIP-UP KNIT NAVY CTCDDC004NV',
      },
      { seller: 'X', price: 1, url: '/go/x', title: 'RACING ZIP-UP KNIT NAVY CTCDDC004NV' },
    ]
    const result = filterRelevantSources(mixed, PRODUCT)

    expect(result.map((s) => s.seller)).toEqual(['무신사'])
  })
})
