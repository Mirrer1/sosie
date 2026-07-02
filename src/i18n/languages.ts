// 지원 언어 코드
export type LanguageCode = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'vi'

// 언어 메타 정보
export type LanguageMeta = {
  code: LanguageCode // localStorage 저장 코드
  label: string // 선택기에 표시할 네이티브 표기
  aiName: string // AI 답변 언어 지시에 쓸 영어 이름
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'ko', label: '한국어', aiName: 'Korean' },
  { code: 'en', label: 'English', aiName: 'English' },
  { code: 'ja', label: '日本語', aiName: 'Japanese' },
  { code: 'zh', label: '中文', aiName: 'Simplified Chinese' },
  { code: 'es', label: 'Español', aiName: 'Spanish' },
  { code: 'fr', label: 'Français', aiName: 'French' },
  { code: 'de', label: 'Deutsch', aiName: 'German' },
  { code: 'pt', label: 'Português', aiName: 'Portuguese' },
  { code: 'ru', label: 'Русский', aiName: 'Russian' },
  { code: 'vi', label: 'Tiếng Việt', aiName: 'Vietnamese' },
]

export const DEFAULT_LANGUAGE: LanguageCode = 'ko'
