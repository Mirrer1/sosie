import { describe, expect, it } from 'vitest'

import {
  buildOutput,
  buildQuery,
  buildQueryVariants,
  dedupeByName,
  expandKeywords,
  isMusinsa,
  isRelevantItem,
  mapNaverItem,
  matchesKeywords,
  matchesStyle,
  scoreProduct,
  styleHints,
} from './searchProducts'

const SAMPLE_ITEM = {
  title: '<b>무신사 스탠다드</b> 와이드 청바지',
  link: 'https://www.musinsa.com/products/sample',
  image: 'https://shopping-phinf.pstatic.net/sample.jpg',
  lprice: '49000',
  hprice: '',
  mallName: '무신사',
  productId: 'mssss-001',
  brand: '무신사 스탠다드',
}

const SAMPLE_RESPONSE = {
  total: 3,
  display: 3,
  items: [
    SAMPLE_ITEM,
    {
      ...SAMPLE_ITEM,
      title: '쿠팡 청바지',
      link: 'https://coupang.com/x',
      mallName: '쿠팡',
      productId: 'coup-002',
      lprice: '29000',
    },
    {
      ...SAMPLE_ITEM,
      title: '무신사 다른 청바지',
      productId: 'mssss-003',
      lprice: '150000',
    },
  ],
}

describe('buildQuery', () => {
  it('기본은 무신사 키워드 자동 첨부', () => {
    expect(buildQuery({ keywords: ['청바지'] })).toBe('무신사 청바지')
  })

  it('브랜드 + 키워드 + 무신사 결합', () => {
    expect(buildQuery({ keywords: ['청바지'], brand: '무신사 스탠다드' })).toBe(
      '무신사 무신사 스탠다드 청바지',
    )
  })

  it('includeOtherMalls면 무신사 키워드 빠짐', () => {
    expect(buildQuery({ keywords: ['청바지', '와이드'], includeOtherMalls: true })).toBe(
      '청바지 와이드',
    )
  })
})

describe('buildQueryVariants', () => {
  it('브랜드와 보조 키워드를 단계적으로 완화', () => {
    const variants = buildQueryVariants({ keywords: ['셔츠', '출근'], brand: '커버낫' })

    expect(variants[0]).toBe('무신사 커버낫 셔츠 출근')
    expect(variants).toContain('무신사 셔츠 출근')
    expect(variants).toContain('무신사 셔츠')
  })

  it('완화할 게 없으면 단일 쿼리', () => {
    expect(buildQueryVariants({ keywords: ['청바지'] })).toEqual(['무신사 청바지'])
  })
})

describe('isMusinsa', () => {
  it('musinsa.com 도메인 또는 mallName 무신사면 true', () => {
    expect(isMusinsa({ link: 'https://link.musinsa.com/abc' })).toBe(true)
    expect(isMusinsa({ mallName: '무신사' })).toBe(true)
    expect(isMusinsa({ link: 'https://coupang.com/x', mallName: '쿠팡' })).toBe(false)
    expect(isMusinsa({})).toBe(false)
  })
})

describe('mapNaverItem', () => {
  it('HTML 제거 + MarketProduct로 변환', () => {
    const product = mapNaverItem(SAMPLE_ITEM)

    expect(product.id).toBe('mssss-001')
    expect(product.name).toBe('무신사 스탠다드 와이드 청바지')
    expect(product.name).not.toContain('<b>')
    expect(product.price).toBe(49000)
    expect(product.mall).toBe('무신사')
    expect(product.brand).toBe('무신사 스탠다드')
  })

  it('brand가 비어있으면 상품명 대괄호에서 추출하고 이름에선 대괄호 제거', () => {
    const product = mapNaverItem({
      ...SAMPLE_ITEM,
      brand: '',
      title: '[<b>티와이</b>] 플레인 스트라이프 셔츠 24FW02BK',
      mallName: '무신사',
    })

    expect(product.brand).toBe('티와이')
    expect(product.name).toBe('플레인 스트라이프 셔츠 24FW02BK')
  })

  it('brand 없고 대괄호도 없으면 판매처명으로 폴백', () => {
    const product = mapNaverItem({
      ...SAMPLE_ITEM,
      brand: '',
      title: '플레인 스트라이프 셔츠',
      mallName: '무신사',
    })

    expect(product.brand).toBe('무신사')
  })
})

describe('buildOutput', () => {
  it('기본은 무신사 입점 상품만 반환', () => {
    const output = buildOutput(SAMPLE_RESPONSE, { keywords: ['청바지'] })

    expect(output.products).toHaveLength(2)
    expect(output.products.every((p) => p.mall.includes('무신사'))).toBe(true)
  })

  it('includeOtherMalls=true면 다른 몰도 포함', () => {
    const output = buildOutput(SAMPLE_RESPONSE, {
      keywords: ['청바지'],
      includeOtherMalls: true,
    })

    expect(output.products).toHaveLength(3)
  })

  it('예산 내 결과가 적으면 예산 밖도 채우되 예산 내를 우선', () => {
    const output = buildOutput(SAMPLE_RESPONSE, {
      keywords: ['청바지'],
      includeOtherMalls: true,
      priceMin: 30000,
      priceMax: 100000,
    })

    expect(output.products.length).toBeGreaterThan(1)
    expect(output.products[0].price).toBe(49000)
  })

  it('브랜드 일치 상품을 네이버 순서보다 위로 재정렬', () => {
    const response = {
      total: 2,
      display: 2,
      items: [
        { ...SAMPLE_ITEM, title: '무신사 베이직 셔츠', productId: 'a', brand: '무신사' },
        { ...SAMPLE_ITEM, title: '커버낫 옥스포드 셔츠', productId: 'b', brand: '커버낫' },
      ],
    }
    const output = buildOutput(response, { keywords: ['셔츠'], brand: '커버낫' })

    expect(output.products[0].id).toBe('b')
  })

  it('몰만 다른 동일 상품명은 1개만 반환', () => {
    const response = {
      total: 2,
      display: 2,
      items: [
        SAMPLE_ITEM,
        { ...SAMPLE_ITEM, productId: 'dup', link: 'https://link.musinsa.com/dup' },
      ],
    }
    const output = buildOutput(response, { keywords: ['청바지'] })

    expect(output.products).toHaveLength(1)
  })
})

describe('isRelevantItem', () => {
  it('중고/도매 등 노이즈 키워드 포함 시 제외', () => {
    expect(isRelevantItem({ title: '무신사 청바지 <b>중고</b>' })).toBe(false)
    expect(isRelevantItem({ title: '데님 도매 100장' })).toBe(false)
  })

  it('패션 외 카테고리는 제외', () => {
    expect(isRelevantItem({ title: '코트걸이', category1: '가구/인테리어' })).toBe(false)
    expect(isRelevantItem({ title: '울 코트', category1: '패션의류' })).toBe(true)
  })

  it('카테고리 없으면 통과', () => {
    expect(isRelevantItem({ title: '와이드 청바지' })).toBe(true)
  })
})

describe('buildOutput 노이즈 필터', () => {
  it('패션 외 카테고리 아이템은 결과에서 제외', () => {
    const response = {
      total: 2,
      display: 2,
      items: [
        { ...SAMPLE_ITEM, title: '청바지 옷걸이', productId: 'noise', category1: '생활/건강' },
        SAMPLE_ITEM,
      ],
    }
    const output = buildOutput(response, { keywords: ['청바지'] })

    expect(output.products).toHaveLength(1)
    expect(output.products[0].id).toBe('mssss-001')
  })
})

describe('matchesKeywords', () => {
  it('키워드가 상품명에 하나라도 있으면 통과', () => {
    const product = mapNaverItem({ ...SAMPLE_ITEM, title: '와이드 데님 팬츠' })

    expect(matchesKeywords(product, ['청바지', '데님'])).toBe(true)
  })

  it('키워드가 전혀 없으면 제외', () => {
    const product = mapNaverItem({ ...SAMPLE_ITEM, title: '가죽 벨트', brand: '무신사' })

    expect(matchesKeywords(product, ['청바지', '데님'])).toBe(false)
  })
})

describe('buildOutput 키워드 정확도 필터', () => {
  it('키워드와 무관한 상품은 결과에서 제외', () => {
    const response = {
      total: 2,
      display: 2,
      items: [SAMPLE_ITEM, { ...SAMPLE_ITEM, title: '무신사 가죽 벨트', productId: 'belt' }],
    }
    const output = buildOutput(response, { keywords: ['청바지'] })

    expect(output.products).toHaveLength(1)
    expect(output.products[0].id).toBe('mssss-001')
  })

  it('키워드가 전부 안 맞아도 카테고리 결과가 있으면 비우지 않음', () => {
    const response = {
      total: 2,
      display: 2,
      items: [
        { ...SAMPLE_ITEM, title: '와이드 데님 팬츠', productId: 'd1' },
        { ...SAMPLE_ITEM, title: '슬림 데님 팬츠', productId: 'd2' },
      ],
    }
    const output = buildOutput(response, { keywords: ['청바지'] })

    expect(output.products).toHaveLength(2)
  })

  it('동의어 매칭으로 데님은 통과, 무관 상품은 제외', () => {
    const response = {
      total: 2,
      display: 2,
      items: [
        { ...SAMPLE_ITEM, title: '와이드 데님 팬츠', productId: 'denim' },
        { ...SAMPLE_ITEM, title: '가죽 벨트', productId: 'belt' },
      ],
    }
    const output = buildOutput(response, { keywords: ['청바지'] })

    expect(output.products).toHaveLength(1)
    expect(output.products[0].id).toBe('denim')
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
  it('정규화된 상품명이 같으면 첫 항목만 남김', () => {
    const products = [
      mapNaverItem({ ...SAMPLE_ITEM, productId: '1' }),
      mapNaverItem({ ...SAMPLE_ITEM, productId: '2' }),
      mapNaverItem({ ...SAMPLE_ITEM, title: '커버낫 셔츠', productId: '3' }),
    ]
    const result = dedupeByName(products)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('1')
  })
})

describe('scoreProduct', () => {
  it('키워드와 브랜드가 일치할수록 점수가 높음', () => {
    const matched = mapNaverItem({ ...SAMPLE_ITEM, title: '커버낫 와이드 청바지', brand: '커버낫' })
    const partial = mapNaverItem({ ...SAMPLE_ITEM, title: '무신사 후드 티셔츠', brand: '무신사' })

    const high = scoreProduct(matched, { keywords: ['청바지', '와이드'], brand: '커버낫' })
    const low = scoreProduct(partial, { keywords: ['청바지', '와이드'], brand: '커버낫' })

    expect(high).toBeGreaterThan(low)
  })

  it('자주 찜한 브랜드면 가산점', () => {
    const product = mapNaverItem({ ...SAMPLE_ITEM, title: '와이드 데님 팬츠', brand: '커버낫' })

    const withFav = scoreProduct(product, { keywords: ['청바지', '데님'] }, ['커버낫'])
    const withoutFav = scoreProduct(product, { keywords: ['청바지', '데님'] })

    expect(withFav).toBeGreaterThan(withoutFav)
  })

  it('스타일 특징 단어가 맞으면 가산점, 없으면 기존 점수 유지', () => {
    const product = mapNaverItem({ ...SAMPLE_ITEM, title: '스트레이트 데님 팬츠', brand: '무신사' })

    const withStyle = scoreProduct(product, { keywords: ['청바지', '데님'], styles: ['캐주얼'] })
    const withoutStyle = scoreProduct(product, { keywords: ['청바지', '데님'] })

    expect(withStyle).toBeGreaterThan(withoutStyle)
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
  it('특징 단어가 상품명에 있으면 true', () => {
    const wide = mapNaverItem({ ...SAMPLE_ITEM, title: '오버핏 와이드 데님 팬츠' })

    expect(matchesStyle(wide, ['스트릿'])).toBe(true)
  })

  it('특징 단어가 없으면 false', () => {
    const slim = mapNaverItem({ ...SAMPLE_ITEM, title: '슬림 데님 팬츠' })

    expect(matchesStyle(slim, ['스트릿'])).toBe(false)
  })

  it('스타일 미지정이면 항상 false', () => {
    const wide = mapNaverItem({ ...SAMPLE_ITEM, title: '오버핏 와이드 데님 팬츠' })

    expect(matchesStyle(wide)).toBe(false)
  })
})

describe('buildQueryVariants 스타일', () => {
  it('스타일이 있으면 특징 단어를 넣은 쿼리를 맨 앞에 둠', () => {
    const variants = buildQueryVariants({ keywords: ['청바지'], styles: ['스트릿'] })

    expect(variants[0]).toBe('무신사 와이드 청바지')
    expect(variants).toContain('무신사 청바지')
  })

  it('스타일이 없으면 기존과 동일', () => {
    expect(buildQueryVariants({ keywords: ['청바지'] })).toEqual(['무신사 청바지'])
  })
})
