import { describe, expect, it } from 'vitest'

import {
  collectLastSearchKeywords,
  collectShownIds,
  mergeSeenIds,
  sanitizeSeenIds,
} from './seenProducts'

describe('collectShownIds', () => {
  it('완료된 searchProducts 결과의 상품 ID만 모음', () => {
    const messages = [
      {
        id: 'm1',
        role: 'assistant',
        parts: [
          { type: 'text', text: '추천드려요' },
          {
            type: 'tool-searchProducts',
            toolCallId: 't1',
            state: 'output-available',
            input: {},
            output: { products: [{ id: 'a' }, { id: 'b' }] },
          },
          { type: 'tool-searchProducts', toolCallId: 't2', state: 'input-available', input: {} },
        ],
      },
    ] as unknown as Parameters<typeof collectShownIds>[0]

    expect(collectShownIds(messages)).toEqual(['a', 'b'])
  })
})

describe('mergeSeenIds', () => {
  it('새 ID를 뒤에 붙이고 다시 본 ID는 최근 위치로 옮김', () => {
    expect(mergeSeenIds(['a', 'b', 'c'], ['b', 'd'])).toEqual(['a', 'c', 'b', 'd'])
  })

  it('최대 개수를 넘으면 오래된 ID부터 제거', () => {
    expect(mergeSeenIds(['a', 'b', 'c'], ['d'], 3)).toEqual(['b', 'c', 'd'])
  })
})

describe('sanitizeSeenIds', () => {
  it('문자열만 남기고 최근 최대 개수로 자름', () => {
    expect(sanitizeSeenIds(['a', 1, null, 'b', 'c'], 2)).toEqual(['b', 'c'])
  })

  it('배열이 아니면 빈 배열', () => {
    expect(sanitizeSeenIds('a')).toEqual([])
    expect(sanitizeSeenIds(undefined)).toEqual([])
  })
})

describe('collectLastSearchKeywords', () => {
  it('대화의 마지막 searchProducts 키워드를 반환', () => {
    const messages = [
      {
        id: 'm1',
        role: 'assistant',
        parts: [{ type: 'tool-searchProducts', input: { keywords: ['셔츠'] } }],
      },
      {
        id: 'm2',
        role: 'assistant',
        parts: [{ type: 'tool-searchProducts', input: { keywords: ['반바지'] } }],
      },
    ] as unknown as Parameters<typeof collectLastSearchKeywords>[0]

    expect(collectLastSearchKeywords(messages)).toEqual(['반바지'])
    expect(collectLastSearchKeywords([])).toEqual([])
  })
})
