'use client'

import { useLanguage } from '@/providers/LanguageProvider'

type ChatEmptyResultProps = {
  onSelect: (text: string) => void
  disabled?: boolean
}

// 검색 결과가 없을 때 안내 화면
const ChatEmptyResult = ({ onSelect, disabled }: ChatEmptyResultProps) => {
  const { t } = useLanguage()
  const suggestions = [
    t('emptyResult.suggestion1'),
    t('emptyResult.suggestion2'),
    t('emptyResult.suggestion3'),
  ]

  return (
    <div className="bg-card flex flex-col items-center gap-2 rounded-lg border p-5 text-center">
      <p className="text-sm">{t('emptyResult.title')}</p>
      <p className="text-muted-foreground text-xs">{t('emptyResult.desc')}</p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(s)}
            className="bg-background hover:bg-accent rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChatEmptyResult
