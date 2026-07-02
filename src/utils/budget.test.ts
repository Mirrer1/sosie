import { describe, expect, it } from 'vitest'

import { formatBudgetParts, formatBudgetRange } from './budget'

// 접미사와 근사 환산을 흉내내는 옵션
const LABELS = {
  suffix: '원',
  orMore: '이상',
  orLess: '이하',
}
const withApprox = { ...LABELS, formatApprox: (krw: number) => `$${krw / 10000}` }

describe('formatBudgetParts', () => {
  it('하한과 상한이 모두 있으면 범위로 표기', () => {
    expect(formatBudgetParts({ min: 50000, max: 200000 }, LABELS)).toEqual({
      main: '50,000원 ~ 200,000원',
      approx: null,
    })
  })

  it('하한만 있으면 orMore 접미사', () => {
    expect(formatBudgetParts({ min: 200000 }, LABELS)).toEqual({
      main: '200,000원 이상',
      approx: null,
    })
  })

  it('상한만 있으면 orLess 접미사', () => {
    expect(formatBudgetParts({ max: 100000 }, LABELS)).toEqual({
      main: '100,000원 이하',
      approx: null,
    })
  })

  it('min이 0이면 상한만 있는 것으로 취급', () => {
    expect(formatBudgetParts({ min: 0, max: 50000 }, LABELS)).toEqual({
      main: '50,000원 이하',
      approx: null,
    })
  })

  it('budget이 없거나 제약이 없으면 빈 값', () => {
    expect(formatBudgetParts(undefined, LABELS)).toEqual({ main: '', approx: null })
    expect(formatBudgetParts({ min: 0 }, LABELS)).toEqual({ main: '', approx: null })
  })

  it('formatApprox가 있으면 범위를 근사 환산으로 함께 반환', () => {
    expect(formatBudgetParts({ min: 50000, max: 200000 }, withApprox)).toEqual({
      main: '50,000원 ~ 200,000원',
      approx: '$5 – $20',
    })
  })

  it('한쪽만 있으면 그 값만 근사 환산', () => {
    expect(formatBudgetParts({ min: 200000 }, withApprox).approx).toBe('$20')
    expect(formatBudgetParts({ max: 100000 }, withApprox).approx).toBe('$10')
  })
})

describe('formatBudgetRange', () => {
  it('금액과 근사 환산을 한 줄로 결합', () => {
    expect(formatBudgetRange({ min: 50000, max: 200000 }, withApprox)).toBe(
      '50,000원 ~ 200,000원 (≈ $5 – $20)',
    )
  })

  it('근사 환산이 없으면 금액만', () => {
    expect(formatBudgetRange({ max: 100000 }, LABELS)).toBe('100,000원 이하')
  })

  it('budget이 없으면 빈 문자열', () => {
    expect(formatBudgetRange(undefined, LABELS)).toBe('')
  })
})
