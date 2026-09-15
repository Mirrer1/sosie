import { describe, expect, it } from 'vitest'

import { splitReasonText } from './reasonText'

describe('splitReasonText', () => {
  it('대괄호 구간을 링크로 나누고 값을 채움', () => {
    expect(splitReasonText('[선호 스타일 {value}]에 맞아요', '캐주얼')).toEqual({
      before: '',
      link: '선호 스타일 캐주얼',
      after: '에 맞아요',
    })
  })

  it('링크가 문장 가운데나 끝에 있어도 나눔', () => {
    expect(splitReasonText('{value} vibe, like [items you saved]', 'Street')).toEqual({
      before: 'Street vibe, like ',
      link: 'items you saved',
      after: '',
    })
  })

  it('대괄호가 없으면 전체를 일반 텍스트로 둠', () => {
    expect(splitReasonText('예산 안이에요')).toEqual({
      before: '예산 안이에요',
      link: '',
      after: '',
    })
  })
})
