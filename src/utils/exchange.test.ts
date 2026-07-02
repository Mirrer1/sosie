import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadRates, saveRates } from './exchange'

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

const RATES = { USD: 0.00072, JPY: 0.11 }

describe('exchange localStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('당일 저장한 환율을 그대로 복원', () => {
    saveRates(RATES)

    expect(loadRates()).toEqual(RATES)
  })

  it('저장된 값이 없으면 null', () => {
    expect(loadRates()).toBeNull()
  })

  it('지난 날짜 캐시면 null', () => {
    localStorage.setItem('sosie:rates', JSON.stringify({ date: '2000-01-01', rates: RATES }))

    expect(loadRates()).toBeNull()
  })

  it('깨진 JSON이면 null', () => {
    localStorage.setItem('sosie:rates', '{not json')

    expect(loadRates()).toBeNull()
  })
})
