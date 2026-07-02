import { type LanguageCode } from '@/i18n/languages'

// 언어별 근사 환산에 쓸 대표 통화로 기준 통화인 ko는 제외
export const CURRENCY_BY_LANGUAGE: Partial<Record<LanguageCode, string>> = {
  en: 'USD',
  ja: 'JPY',
  zh: 'CNY',
  es: 'EUR',
  fr: 'EUR',
  de: 'EUR',
  pt: 'EUR',
  ru: 'RUB',
  vi: 'VND',
}

// 금액을 통화 기호가 붙은 정수 문자열로 변환
export const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount)
