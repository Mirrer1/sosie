import { describe, expect, it } from 'vitest'

import { MAX_IMAGE_SIZE, validateImage } from './image'

// 지정한 타입과 크기를 가진 가짜 이미지 파일 생성
const makeFile = (type: string, size = 1024): File =>
  new File([new ArrayBuffer(size)], 'sample', { type })

describe('validateImage', () => {
  it('허용 형식과 크기면 null 반환', () => {
    expect(validateImage(makeFile('image/jpeg'))).toBeNull()
    expect(validateImage(makeFile('image/png'))).toBeNull()
    expect(validateImage(makeFile('image/webp'))).toBeNull()
  })

  it('허용하지 않는 형식이면 형식 에러 코드', () => {
    expect(validateImage(makeFile('image/gif'))).toBe('type')
  })

  it('5MB를 초과하면 용량 에러 코드', () => {
    expect(validateImage(makeFile('image/jpeg', MAX_IMAGE_SIZE + 1))).toBe('size')
  })

  it('정확히 5MB는 통과', () => {
    expect(validateImage(makeFile('image/jpeg', MAX_IMAGE_SIZE))).toBeNull()
  })
})
