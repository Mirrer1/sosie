import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearProfile, hasProfile, loadProfile, saveProfile } from './profile'
import { type Profile } from '@/types/profile'

// localStorage를 흉내내는 인메모리 목
const createStorageMock = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  }
}

const SAMPLE: Profile = {
  styles: ['캐주얼'],
  brands: ['무신사 스탠다드'],
  size: 'M',
  budget: { min: 50000, max: 150000 },
}

describe('profile localStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('저장한 프로필을 그대로 복원', () => {
    saveProfile(SAMPLE)

    expect(loadProfile()).toEqual(SAMPLE)
  })

  it('저장된 값이 없으면 null', () => {
    expect(loadProfile()).toBeNull()
  })

  it('깨진 JSON이면 null', () => {
    localStorage.setItem('sosie:profile', '{not json')

    expect(loadProfile()).toBeNull()
  })

  it('스키마에 맞지 않는 값이면 null', () => {
    localStorage.setItem('sosie:profile', JSON.stringify({ size: 'XXL' }))

    expect(loadProfile()).toBeNull()
  })

  it('hasProfile은 저장 여부를 반영', () => {
    expect(hasProfile()).toBe(false)
    saveProfile(SAMPLE)
    expect(hasProfile()).toBe(true)
  })

  it('clearProfile 후에는 복원되지 않음', () => {
    saveProfile(SAMPLE)
    clearProfile()

    expect(loadProfile()).toBeNull()
    expect(hasProfile()).toBe(false)
  })
})
