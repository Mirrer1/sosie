import { describe, expect, it } from 'vitest'

import { buildProfileUpdate } from './updateProfile'

describe('buildProfileUpdate', () => {
  it('mode와 reason을 분리하고 나머지는 updated로 묶음', () => {
    const result = buildProfileUpdate({
      styles: ['빈티지'],
      mode: 'merge',
      reason: '빈티지도 좋아한다고 언급',
    })

    expect(result.updated).toEqual({ styles: ['빈티지'] })
    expect(result.mode).toBe('merge')
    expect(result.reason).toBe('빈티지도 좋아한다고 언급')
  })

  it('mode replace를 그대로 전달', () => {
    const result = buildProfileUpdate({
      brands: ['커버낫'],
      mode: 'replace',
      reason: '선호 브랜드를 커버낫으로 교체',
    })

    expect(result.mode).toBe('replace')
    expect(result.updated.brands).toEqual(['커버낫'])
  })

  it('여러 필드를 한 번에 updated로 묶음', () => {
    const result = buildProfileUpdate({
      styles: ['미니멀'],
      brands: ['무신사 스탠다드'],
      size: 'M',
      budget: { min: 150000, max: 300000 },
      mode: 'merge',
      reason: '온보딩 정보 갱신',
    })

    expect(result.updated).toEqual({
      styles: ['미니멀'],
      brands: ['무신사 스탠다드'],
      size: 'M',
      budget: { min: 150000, max: 300000 },
    })
  })

  it('일부 필드만 보내면 그 필드만 updated에 포함', () => {
    const result = buildProfileUpdate({
      budget: { min: 0, max: 50000 },
      mode: 'merge',
      reason: '예산 상한 하향',
    })

    expect(result.updated).toEqual({ budget: { min: 0, max: 50000 } })
    expect(result.updated.styles).toBeUndefined()
  })
})
