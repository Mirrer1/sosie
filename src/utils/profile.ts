import { type Profile, profileSchema } from '@/types/profile'

const STORAGE_KEY = 'sosie:profile'

// localStorage에서 프로필 읽기
export const loadProfile = (): Profile | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const result = profileSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

// 프로필 저장
export const saveProfile = (profile: Profile): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // 저장 실패는 무시
  }
}

// localStorage에 프로필 키 존재 여부
export const hasProfile = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

// 프로필 삭제
export const clearProfile = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
