import { DEFAULT_LANGUAGE, LANGUAGES, type LanguageCode } from '@/i18n/languages'

const STORAGE_KEY = 'sosie:language'

// 지원 언어 코드 여부
const isSupported = (code: string): code is LanguageCode =>
  LANGUAGES.some((lang) => lang.code === code)

// localStorage에서 언어 코드 읽기
export const loadLanguage = (): LanguageCode | null => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw && isSupported(raw) ? raw : null
}

// 언어 코드 저장
export const saveLanguage = (lang: LanguageCode): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // 저장 실패는 무시
  }
}

// 브라우저 언어를 지원 코드로 매핑
export const resolveBrowserLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  const prefix = navigator.language.slice(0, 2)
  return isSupported(prefix) ? prefix : DEFAULT_LANGUAGE
}
