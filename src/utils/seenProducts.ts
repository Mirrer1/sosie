import { type UIMessage } from 'ai'

import { type SearchProductsOutput } from '@/types/tool'

const STORAGE_KEY = 'sosie:seen-products'
const MAX_SEEN = 300

// 대화의 검색 결과 상품 ID 수집
export const collectShownIds = (messages: UIMessage[]): string[] =>
  messages.flatMap((message) =>
    message.parts.flatMap((part) =>
      part.type === 'tool-searchProducts' && part.state === 'output-available'
        ? ((part.output as SearchProductsOutput | undefined)?.products ?? []).map((p) => p.id)
        : [],
    ),
  )

// 대화의 마지막 검색 키워드 추출
export const collectLastSearchKeywords = (messages: UIMessage[]): string[] => {
  const inputs = messages.flatMap((message) =>
    message.parts.flatMap((part) =>
      part.type === 'tool-searchProducts' && 'input' in part
        ? [(part.input as { keywords?: string[] } | undefined)?.keywords ?? []]
        : [],
    ),
  )
  return inputs.filter((keywords) => keywords.length > 0).at(-1) ?? []
}

// 새 ID를 최근 순으로 합치고 최대 개수만 유지
export const mergeSeenIds = (prev: string[], next: string[], max = MAX_SEEN): string[] => {
  const nextSet = new Set(next)
  return [...prev.filter((id) => !nextSet.has(id)), ...nextSet].slice(-max)
}

// 요청의 본 상품 ID 정리
export const sanitizeSeenIds = (value: unknown, max = MAX_SEEN): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string').slice(-max) : []

// 본 상품 ID 읽기
export const loadSeenIds = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    return sanitizeSeenIds(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

// 본 상품 ID 추가 저장
export const addSeenIds = (ids: string[]): void => {
  if (typeof window === 'undefined' || ids.length === 0) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeSeenIds(loadSeenIds(), ids)))
  } catch {
    // 저장 실패는 무시
  }
}
