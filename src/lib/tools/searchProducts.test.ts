import { describe, expect, it } from 'vitest'

import {
  type CandidateProduct,
  buildOutput,
  buildSearchKeywords,
  dedupeByName,
  expandKeywords,
  mapProductRow,
  matchesKeywords,
  matchesStyle,
  pickProducts,
  scoreProduct,
  styleHints,
} from './searchProducts'
import { type ProductRow } from '@/types/catalog'

const SAMPLE_ROW: ProductRow = {
  id: 'g-001',
  title: '무신사 스탠다드MUSINSA STANDARD 와이드 데님 팬츠',
  name: '와이드 데님 팬츠',
  brand: '무신사 스탠다드',
  price: 49000,
  image_url: 'https://encrypted-tbn1.gstatic.com/shopping?q=sample',
  mall: '무신사',
  category: '바지',
  subcategory: '데님팬츠',
  gender: '공용',
  colors: ['블루'],
  materials: ['데님'],
  styles: ['캐주얼'],
  keywords: ['청바지', '와이드진'],
  search_text: '무신사스탠다드와이드데님팬츠바지데님팬츠청바지와이드진블루데님캐주얼',
  product_link: 'https://www.google.co.kr/search?ibp=oshop',
  immersive_token: 'token',
  direct_url: null,
  first_seen_at: '2026-09-15T00:00:00Z',
  last_seen_at: '2026-09-15T00:00:00Z',
  price_updated_at: '2026-09-15T00:00:00Z',
}

// 이름과 브랜드만 바꾼 후보 상품 생성
const candidate = (overrides: Partial<CandidateProduct>): CandidateProduct => ({
  ...mapProductRow(SAMPLE_ROW),
  searchText: undefined,
  styles: undefined,
  ...overrides,
})

describe('mapProductRow', () => {
  it('DB 행을 카드용 상품으로 변환하고 링크는 직링크 이동 경로로 연결', () => {
    const product = mapProductRow(SAMPLE_ROW)

    expect(product.id).toBe('g-001')
    expect(product.brand).toBe('무신사 스탠다드')
    expect(product.imageUrl).toBe(SAMPLE_ROW.image_url)
    expect(product.productUrl).toBe('/go/g-001')
    expect(product.styles).toEqual(['캐주얼'])
    expect(product.searchText).toBe(SAMPLE_ROW.search_text)
  })
})

describe('buildSearchKeywords', () => {
  it('동의어와 띄어쓴 단어를 펼쳐 정규화', () => {
    const keywords = buildSearchKeywords(['여름 반바지'])

    expect(keywords).toContain('여름반바지')
    expect(keywords).toContain('여름')
    expect(keywords).toContain('쇼츠')
  })

  it('한 글자 단어와 LIKE 특수문자는 제외', () => {
    expect(buildSearchKeywords(['a', '100%'])).toEqual(['100'])
  })
})

describe('buildOutput', () => {
  it('예산 내 결과가 적으면 예산 밖도 채우되 예산 내를 우선', () => {
    const output = buildOutput(
      [
        candidate({ id: 'cheap', name: '데님 팬츠 A', price: 49000 }),
        candidate({ id: 'expensive', name: '데님 팬츠 B', price: 150000 }),
      ],
      { keywords: ['데님'], priceMin: 30000, priceMax: 100000 },
    )

    expect(output.products).toHaveLength(2)
    expect(output.products[0].id).toBe('cheap')
  })

  it('브랜드 일치 상품을 위로 재정렬', () => {
    const output = buildOutput(
      [
        candidate({ id: 'a', name: '베이직 셔츠', brand: '무신사 스탠다드' }),
        candidate({ id: 'b', name: '옥스포드 셔츠', brand: '커버낫' }),
      ],
      { keywords: ['셔츠'], brand: '커버낫' },
    )

    expect(output.products[0].id).toBe('b')
  })

  it('브랜드와 이름이 같은 상품은 1개만 반환', () => {
    const output = buildOutput([candidate({ id: '1' }), candidate({ id: '2', mall: '29CM' })], {
      keywords: ['데님'],
    })

    expect(output.products).toHaveLength(1)
  })

  it('검색 문자열의 태그 키워드로도 매칭', () => {
    const output = buildOutput(
      [
        candidate({ id: 'tagged', name: '루즈핏 팬츠', searchText: '루즈핏팬츠청바지' }),
        candidate({ id: 'belt', name: '가죽 벨트', searchText: '가죽벨트' }),
      ],
      { keywords: ['청바지'] },
    )

    expect(output.products.map((p) => p.id)).toEqual(['tagged'])
  })

  it('키워드가 전부 안 맞아도 후보가 있으면 비우지 않음', () => {
    const output = buildOutput(
      [candidate({ id: 'd1', name: '와이드 팬츠' }), candidate({ id: 'd2', name: '슬림 팬츠' })],
      { keywords: ['코트'] },
    )

    expect(output.products).toHaveLength(2)
  })
})

describe('matchesKeywords', () => {
  it('키워드가 상품명에 하나라도 있으면 통과', () => {
    expect(matchesKeywords(candidate({ name: '와이드 데님 팬츠' }), ['청바지', '데님'])).toBe(true)
  })

  it('키워드가 전혀 없으면 제외', () => {
    expect(matchesKeywords(candidate({ name: '가죽 벨트', brand: '무신사' }), ['청바지'])).toBe(
      false,
    )
  })
})

describe('expandKeywords', () => {
  it('같은말을 추가', () => {
    expect(expandKeywords(['청바지'])).toContain('데님')
  })

  it('같은말 없으면 원본만 유지', () => {
    expect(expandKeywords(['코트'])).toEqual(['코트'])
  })

  it('확장된 카테고리도 같은말 매핑', () => {
    expect(expandKeywords(['남방'])).toContain('셔츠')
    expect(expandKeywords(['패딩'])).toContain('다운')
  })
})

describe('dedupeByName', () => {
  it('정규화된 브랜드와 상품명이 같으면 첫 항목만 남김', () => {
    const result = dedupeByName([
      candidate({ id: '1' }),
      candidate({ id: '2' }),
      candidate({ id: '3', name: '커버낫 셔츠' }),
    ])

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('1')
  })
})

describe('scoreProduct', () => {
  it('키워드와 브랜드가 일치할수록 점수가 높음', () => {
    const matched = candidate({ name: '와이드 청바지', brand: '커버낫' })
    const partial = candidate({ name: '후드 티셔츠', brand: '무신사' })
    const input = { keywords: ['청바지', '와이드'], brand: '커버낫' }

    expect(scoreProduct(matched, input)).toBeGreaterThan(scoreProduct(partial, input))
  })

  it('세부 품목이 키워드와 맞으면 가산점', () => {
    const knit = candidate({ name: '솔리드 니트', subcategory: '니트' })
    const tie = candidate({ name: '솔리드 니트 넥타이', subcategory: '넥타이' })

    expect(scoreProduct(knit, { keywords: ['니트'] })).toBeGreaterThan(
      scoreProduct(tie, { keywords: ['니트'] }),
    )
  })

  it('자주 찜한 브랜드면 가산점', () => {
    const product = candidate({ name: '와이드 데님 팬츠', brand: '커버낫' })
    const input = { keywords: ['청바지', '데님'] }

    expect(scoreProduct(product, input, ['커버낫'])).toBeGreaterThan(scoreProduct(product, input))
  })

  it('스타일 태그가 맞으면 가산점', () => {
    const product = candidate({ name: '데님 팬츠', styles: ['캐주얼'] })

    expect(scoreProduct(product, { keywords: ['데님'], styles: ['캐주얼'] })).toBeGreaterThan(
      scoreProduct(product, { keywords: ['데님'] }),
    )
  })
})

describe('styleHints', () => {
  it('스타일을 상품명에 나오는 특징 단어로 펼침', () => {
    expect(styleHints(['스트릿'])).toContain('와이드')
    expect(styleHints(['캐주얼'])).toContain('스트레이트')
  })

  it('스타일이 없으면 빈 배열', () => {
    expect(styleHints()).toEqual([])
    expect(styleHints(['모르는스타일'])).toEqual([])
  })
})

describe('matchesStyle', () => {
  it('AI 스타일 태그가 겹치면 true', () => {
    expect(matchesStyle(candidate({ name: '티셔츠', styles: ['고프코어'] }), ['고프코어'])).toBe(
      true,
    )
  })

  it('태그가 없어도 특징 단어가 상품명에 있으면 true', () => {
    expect(matchesStyle(candidate({ name: '오버핏 와이드 데님 팬츠' }), ['스트릿'])).toBe(true)
  })

  it('태그와 특징 단어가 모두 없으면 false', () => {
    expect(matchesStyle(candidate({ name: '슬림 데님 팬츠' }), ['스트릿'])).toBe(false)
  })

  it('스타일 미지정이면 항상 false', () => {
    expect(matchesStyle(candidate({ name: '오버핏 와이드 데님 팬츠' }))).toBe(false)
  })
})

describe('pickProducts', () => {
  it('브랜드당 2개로 제한하되 모자라면 한도 넘겨 채움', () => {
    const products = [
      ...Array.from({ length: 4 }, (_, i) => candidate({ id: `a${i}`, brand: 'A', name: `a${i}` })),
      candidate({ id: 'b0', brand: 'B', name: 'b0' }),
    ]
    const picked = pickProducts(products)

    expect(picked).toHaveLength(5)
    expect(picked.slice(0, 3).filter((p) => p.brand === 'A')).toHaveLength(2)
  })
})
