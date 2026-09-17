import { describe, expect, it } from 'vitest'

import {
  type CandidateProduct,
  buildOutput,
  buildPreferences,
  buildSearchKeywords,
  dedupeByName,
  expandKeywords,
  extractColorIntent,
  hasOutOfBudget,
  mapProductRow,
  matchesKeywords,
  matchesStyle,
  pickProducts,
  pickStyles,
  pickWithOtherMalls,
  resolveSearchInput,
  scoreProduct,
  styleHints,
  withPreviousItemKeywords,
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

describe('resolveSearchInput', () => {
  const PROFILE = {
    styles: ['캐주얼'],
    brands: ['무신사 스탠다드'],
    budget: { min: 30000, max: 70000 },
  }

  it('AI가 생략한 스타일과 예산을 프로필로 채움', () => {
    const { input } = resolveSearchInput({ keywords: ['반팔티'] }, PROFILE)

    expect(input.styles).toEqual(['캐주얼'])
    expect(input.priceMin).toBe(30000)
    expect(input.priceMax).toBe(70000)
  })

  it('이번 요청에 예산이나 스타일이 있으면 프로필보다 우선하고 예산은 섞지 않음', () => {
    const { input } = resolveSearchInput(
      { keywords: ['반팔티'], styles: ['스트릿'], priceMax: 20000 },
      PROFILE,
    )

    expect(input.styles).toEqual(['스트릿'])
    expect(input.priceMin).toBeUndefined()
    expect(input.priceMax).toBe(20000)
  })

  it('성별 단어를 필터로 옮기고 키워드에서 뺌', () => {
    const { input, gender } = resolveSearchInput({ keywords: ['여자', '원피스'] })

    expect(gender).toBe('여성')
    expect(input.keywords).toEqual(['원피스'])
  })

  it('검색어에 성별이 없으면 프로필 성별을 쓰고 검색어 성별이 있으면 우선', () => {
    expect(resolveSearchInput({ keywords: ['셔츠'] }, { gender: '여성' }).gender).toBe('여성')
    expect(resolveSearchInput({ keywords: ['남자', '셔츠'] }, { gender: '여성' }).gender).toBe(
      '남성',
    )
    expect(resolveSearchInput({ keywords: ['셔츠'] }, {}).gender).toBeNull()
  })

  it('성별 단어만 있으면 키워드는 그대로 둠', () => {
    const { input, gender } = resolveSearchInput({ keywords: ['남자'] })

    expect(gender).toBe('남성')
    expect(input.keywords).toEqual(['남자'])
  })
})

describe('buildPreferences', () => {
  it('프로필 브랜드와 찜 브랜드를 정규화해 중복 없이 합치고 찜 스타일과 가격대를 담음', () => {
    const preferences = buildPreferences(
      { brands: ['무신사 스탠다드'] },
      {
        count: 3,
        brands: ['커버낫', '무신사스탠다드'],
        styles: ['스트릿'],
        priceRange: { min: 30000, max: 60000 },
      },
    )

    expect(preferences).toEqual({
      brands: ['무신사스탠다드', '커버낫'],
      favoriteStyles: ['스트릿'],
      favoritePriceRange: { min: 30000, max: 60000 },
    })
  })
})

describe('pickStyles', () => {
  const PREFERENCES = { brands: [], favoriteStyles: ['빈티지'] }

  it('요청이나 프로필 스타일이 있으면 그대로 사용', () => {
    expect(pickStyles({ keywords: ['셔츠'], styles: ['캐주얼'] }, PREFERENCES)).toEqual(['캐주얼'])
  })

  it('스타일이 없으면 찜 스타일로 대체', () => {
    expect(pickStyles({ keywords: ['셔츠'] }, PREFERENCES)).toEqual(['빈티지'])
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

  it('선호 브랜드와 정확히 같은 브랜드면 가산점', () => {
    const product = candidate({ name: '와이드 데님 팬츠', brand: '커버낫' })
    const input = { keywords: ['청바지', '데님'] }

    expect(
      scoreProduct(product, input, { brands: ['커버낫'], favoriteStyles: [] }),
    ).toBeGreaterThan(scoreProduct(product, input))
  })

  it('성별이 정해져 있으면 공용보다 정확히 같은 성별에 가산점', () => {
    const preferences = { brands: [], favoriteStyles: [], gender: '여성' as const }
    const women = candidate({ name: '셔츠', gender: '여성' })
    const unisex = candidate({ name: '셔츠', gender: '공용' })

    expect(scoreProduct(women, { keywords: ['셔츠'] }, preferences)).toBeGreaterThan(
      scoreProduct(unisex, { keywords: ['셔츠'] }, preferences),
    )
  })

  it('찜한 스타일과 겹치면 가산점', () => {
    const product = candidate({ name: '데님 팬츠', styles: ['스트릿'] })
    const input = { keywords: ['데님'] }

    expect(
      scoreProduct(product, input, { brands: [], favoriteStyles: ['스트릿'] }),
    ).toBeGreaterThan(scoreProduct(product, input))
  })

  it('예산이 없을 때만 찜 가격대 안이면 가산점', () => {
    const product = candidate({ name: '데님 팬츠', price: 50000 })
    const preferences = {
      brands: [],
      favoriteStyles: [],
      favoritePriceRange: { min: 40000, max: 60000 },
    }

    expect(scoreProduct(product, { keywords: ['데님'] }, preferences)).toBeGreaterThan(
      scoreProduct(product, { keywords: ['데님'] }),
    )
    expect(scoreProduct(product, { keywords: ['데님'], priceMax: 100000 }, preferences)).toBe(
      scoreProduct(product, { keywords: ['데님'], priceMax: 100000 }),
    )
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

  const preferred = Array.from({ length: 3 }, (_, i) =>
    candidate({ id: `v${i}`, brand: `빈티지브랜드${i}`, name: `v${i}`, styles: ['빈티지'] }),
  )
  const plain = Array.from({ length: 8 }, (_, i) =>
    candidate({ id: `p${i}`, brand: `일반브랜드${i}`, name: `p${i}`, styles: ['캐주얼'] }),
  )

  it('선호 스타일 상품을 새 상품보다 먼저 채움', () => {
    const picked = pickProducts([...plain, ...preferred], { styles: ['빈티지'] })

    expect(picked.filter((p) => p.styles?.includes('빈티지'))).toHaveLength(3)
  })

  it('선호 브랜드 상품도 선호 스타일과 같은 우선순위로 채움', () => {
    const brandItem = candidate({ id: 'c1', brand: '커버낫', name: 'c1', styles: ['캐주얼'] })
    const picked = pickProducts([...plain, brandItem], { styles: ['빈티지'], brands: ['커버낫'] })

    expect(picked.map((p) => p.id)).toContain('c1')
  })

  it('이미 본 선호 상품은 최대 2개만 다시 넣고 나머지는 새 상품으로 채움', () => {
    const picked = pickProducts([...plain, ...preferred], {
      styles: ['빈티지'],
      shownIds: preferred.map((p) => p.id),
    })

    expect(picked).toHaveLength(6)
    expect(picked.filter((p) => p.styles?.includes('빈티지'))).toHaveLength(2)
  })
})

describe('buildOutput 이미 보여준 상품', () => {
  const items = Array.from({ length: 8 }, (_, i) => candidate({ id: String(i), name: `데님 ${i}` }))

  it('이미 보여준 상품을 풀 뒤로 보냄', () => {
    const output = buildOutput(items, { keywords: ['데님'] }, undefined, ['0', '1'])
    const ids = output.products.map((p) => p.id)

    expect(ids).toHaveLength(8)
    expect(ids.slice(-2).sort()).toEqual(['0', '1'])
  })
})

describe('pickWithOtherMalls', () => {
  const musinsa = Array.from({ length: 8 }, (_, i) =>
    candidate({ id: `m${i}`, brand: `무신사브랜드${i}`, styles: ['캐주얼'] }),
  )
  const others = Array.from({ length: 4 }, (_, i) =>
    candidate({ id: `o${i}`, brand: `다른브랜드${i}`, mall: '29CM' }),
  )

  it('다른 판매처 요청이면 스타일이 달라도 다른 판매처 상품을 최대 3개 포함', () => {
    const picked = pickWithOtherMalls([...musinsa, ...others], { styles: ['캐주얼'] }, true)

    expect(picked).toHaveLength(6)
    expect(picked.filter((p) => p.mall !== '무신사')).toHaveLength(3)
  })

  it('다른 판매처 요청이 아니면 스타일 맞는 상품을 우선', () => {
    const picked = pickWithOtherMalls([...musinsa, ...others], { styles: ['캐주얼'] }, false)

    expect(picked.every((p) => p.mall === '무신사')).toBe(true)
  })
})

describe('hasOutOfBudget', () => {
  it('예산이 있고 예산 밖 상품이 섞이면 true', () => {
    const products = [candidate({ price: 25000 }), candidate({ price: 45000 })]

    expect(hasOutOfBudget(products, { keywords: ['운동화'], priceMax: 30000 })).toBe(true)
    expect(hasOutOfBudget([products[0]], { keywords: ['운동화'], priceMax: 30000 })).toBe(false)
  })

  it('예산이 없으면 false', () => {
    expect(hasOutOfBudget([candidate({ price: 450000 })], { keywords: ['운동화'] })).toBe(false)
  })
})

describe('buildOutput 다른 판매처 요청', () => {
  const musinsa = Array.from({ length: 40 }, (_, i) =>
    candidate({ id: `m${i}`, name: `데님 팬츠 ${i}`, searchText: '데님팬츠데님' }),
  )
  const other = candidate({ id: 'o1', name: '다른 몰 청바지', mall: '29CM', searchText: '청바지' })

  it('점수가 낮아도 다른 판매처 상품을 풀에 남김', () => {
    const output = buildOutput([...musinsa, other], {
      keywords: ['데님', '청바지'],
      includeOtherMalls: true,
    })

    expect(output.products.map((p) => p.id)).toContain('o1')
  })

  it('다른 판매처 요청이 아니면 상위 풀만 남김', () => {
    const output = buildOutput([...musinsa, other], { keywords: ['데님', '청바지'] })

    expect(output.products).toHaveLength(30)
  })
})

describe('extractColorIntent', () => {
  it('색상 분위기 표현과 색상 일반어를 검색어에서 빼고 색상 분위기로 변환', () => {
    const { keywords, colors } = extractColorIntent(['반바지', '비비드 컬러', '컬러풀한'])

    expect(keywords).toEqual(['반바지'])
    expect(colors?.include).toContain('레드')
    expect(colors?.exclude).toContain('블랙')
  })

  it('품목과 색상 이름이 함께 있으면 색상 이름은 가산점 색상으로 옮김', () => {
    expect(extractColorIntent(['반바지', '베이지', '빨간'])).toEqual({
      keywords: ['반바지'],
      colors: { include: ['베이지', '빨간', '레드'], exclude: [] },
    })
  })

  it('색상 표현이 없으면 검색어를 그대로 두고 null', () => {
    expect(extractColorIntent(['반바지', '와이드'])).toEqual({
      keywords: ['반바지', '와이드'],
      colors: null,
    })
    expect(extractColorIntent(['베이지'])).toEqual({ keywords: ['베이지'], colors: null })
  })
})

describe('pickProducts 색상 분위기', () => {
  it('색상 분위기가 있으면 맞는 색상 상품을 먼저 채움', () => {
    const dark = Array.from({ length: 6 }, (_, i) =>
      candidate({ id: `d${i}`, brand: `다크${i}`, name: `쇼츠 블랙 ${i}`, colors: ['블랙'] }),
    )
    const vivid = [
      candidate({ id: 'v1', brand: '비비드1', name: '쇼츠 레몬', colors: ['레몬'] }),
      candidate({ id: 'v2', brand: '비비드2', name: '쇼츠 레드', colors: ['레드'] }),
    ]
    const { colors } = extractColorIntent(['비비드'])
    const picked = pickProducts([...dark, ...vivid], { colors })

    expect(picked.map((p) => p.id)).toEqual(expect.arrayContaining(['v1', 'v2']))
  })
})

describe('pickProducts 작은 풀', () => {
  it('새 상품이 모자라면 이미 본 선호 상품으로 끝까지 채움', () => {
    const products = Array.from({ length: 6 }, (_, i) =>
      candidate({ id: `s${i}`, brand: `브랜드${i}`, name: `빈티지 쇼츠 ${i}`, styles: ['빈티지'] }),
    )
    const picked = pickProducts(products, {
      styles: ['빈티지'],
      shownIds: products.map((p) => p.id),
    })

    expect(picked).toHaveLength(6)
  })
})

describe('withPreviousItemKeywords', () => {
  it('검색어가 색상뿐이면 직전 검색의 품목 키워드를 붙임', () => {
    expect(withPreviousItemKeywords(['베이지', '그레이'], ['반바지', '쇼츠'])).toEqual([
      '반바지',
      '쇼츠',
      '베이지',
      '그레이',
    ])
    expect(withPreviousItemKeywords(['다른 컬러'], ['반바지', '비비드'])).toEqual([
      '반바지',
      '다른 컬러',
    ])
  })

  it('품목이 있거나 직전 검색이 없으면 그대로', () => {
    expect(withPreviousItemKeywords(['셔츠', '블루'], ['반바지'])).toEqual(['셔츠', '블루'])
    expect(withPreviousItemKeywords(['베이지'], [])).toEqual(['베이지'])
  })
})
