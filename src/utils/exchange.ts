const STORAGE_KEY = 'sosie:rates'
const API_URL = 'https://open.er-api.com/v6/latest/KRW'

type CachedRates = {
  date: string // 저장 당일 날짜
  rates: Record<string, number> // KRW 1원당 통화별 환산 비율
}

// 오늘 날짜 문자열
const today = (): string => new Date().toISOString().slice(0, 10)

// 당일 캐시된 환율을 반환하되 없거나 지난 날짜면 null
export const loadRates = (): Record<string, number> | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedRates
    return parsed.date === today() ? parsed.rates : null
  } catch {
    return null
  }
}

// 환율을 당일 날짜와 함께 저장
export const saveRates = (rates: Record<string, number>): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), rates }))
  } catch {
    // 저장 실패는 무시
  }
}

// KRW 기준 환율을 외부 API에서 조회하되 실패하면 null
export const fetchRates = async (): Promise<Record<string, number> | null> => {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) return null
    const data = await res.json()
    return data?.result === 'success' ? (data.rates as Record<string, number>) : null
  } catch {
    return null
  }
}
