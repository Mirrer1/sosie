import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadLanguage, resolveBrowserLanguage, saveLanguage } from './language'

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

describe('language localStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('저장한 언어 코드를 그대로 복원', () => {
    saveLanguage('en')

    expect(loadLanguage()).toBe('en')
  })

  it('저장된 값이 없으면 null', () => {
    expect(loadLanguage()).toBeNull()
  })

  it('지원하지 않는 코드면 null', () => {
    localStorage.setItem('sosie:language', 'xx')

    expect(loadLanguage()).toBeNull()
  })
})

describe('resolveBrowserLanguage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // navigator.language 접두어를 지원 코드로 매핑
  const withNavigatorLanguage = (language: string) => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', { language })
  }

  it('지원 언어의 지역 코드를 접두어로 매핑', () => {
    withNavigatorLanguage('ja-JP')

    expect(resolveBrowserLanguage()).toBe('ja')
  })

  it('지원 언어면 접두어 그대로 반환', () => {
    withNavigatorLanguage('zh-CN')

    expect(resolveBrowserLanguage()).toBe('zh')
  })

  it('지원하지 않는 언어면 기본 언어로 대체', () => {
    withNavigatorLanguage('th-TH')

    expect(resolveBrowserLanguage()).toBe('ko')
  })
})
