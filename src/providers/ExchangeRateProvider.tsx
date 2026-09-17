'use client'

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { CURRENCY_BY_LANGUAGE, formatCurrency } from '@/i18n/currency'
import { useLanguage } from '@/providers/LanguageProvider'
import { fetchRates, loadRates, saveRates } from '@/utils/exchange'

type ExchangeRateContextValue = {
  formatApprox: (krw: number) => string | null
}

const ExchangeRateContext = createContext<ExchangeRateContextValue | null>(null)

// 선택 언어 통화 환율 제공
const ExchangeRateProvider = ({ children }: { children: ReactNode }) => {
  const { lang } = useLanguage()
  const [rates, setRates] = useState<Record<string, number> | null>(null)

  // 마운트 시 당일 캐시나 외부 API로 환율 조회
  useEffect(() => {
    const cached = loadRates()
    if (cached) {
      setRates(cached)
      return
    }
    let active = true
    fetchRates().then((fetched) => {
      if (!active || !fetched) return
      setRates(fetched)
      saveRates(fetched)
    })
    return () => {
      active = false
    }
  }, [])

  // 원화를 선택 언어 통화 근사치로 변환
  const formatApprox = useCallback(
    (krw: number) => {
      const currency = CURRENCY_BY_LANGUAGE[lang]
      const rate = currency && rates ? rates[currency] : undefined
      return currency && rate ? formatCurrency(krw * rate, currency) : null
    },
    [lang, rates],
  )

  return (
    <ExchangeRateContext.Provider value={{ formatApprox }}>{children}</ExchangeRateContext.Provider>
  )
}

export default ExchangeRateProvider

export const useExchangeRate = () => {
  const ctx = useContext(ExchangeRateContext)
  if (!ctx) throw new Error('useExchangeRate는 ExchangeRateProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
