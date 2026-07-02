'use client'

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { type DictKey, dictionaries } from '@/i18n/dictionaries'
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/languages'
import { loadLanguage, resolveBrowserLanguage, saveLanguage } from '@/utils/language'

type LanguageContextValue = {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (key: DictKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

// 선택 언어와 번역 함수를 앱 전역에 제공
const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LanguageCode>(DEFAULT_LANGUAGE)

  // 마운트 시 저장된 언어를 복원하거나 브라우저 언어로 추정
  useEffect(() => {
    setLangState(loadLanguage() ?? resolveBrowserLanguage())
  }, [])

  // 선택 언어를 문서 lang 속성에 반영
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // 언어 변경 후 저장
  const setLang = (next: LanguageCode) => {
    setLangState(next)
    saveLanguage(next)
  }

  // 선택 언어 사전에서 문구를 찾되 없으면 기본 언어로 대체
  const t = (key: DictKey) => {
    const dict = dictionaries[lang] ?? dictionaries[DEFAULT_LANGUAGE]
    return dict?.[key] ?? dictionaries[DEFAULT_LANGUAGE]?.[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  )
}

export default LanguageProvider

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage는 LanguageProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
