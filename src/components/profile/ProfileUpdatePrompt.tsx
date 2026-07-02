'use client'

import { Button } from '@/components/ui/button'
import { type DictKey } from '@/i18n/dictionaries'
import { BRAND_LABEL_KEYS, BUDGET_LABEL_KEYS, STYLE_LABEL_KEYS } from '@/i18n/profileLabels'
import { useLanguage } from '@/providers/LanguageProvider'
import { type UpdateProfileOutput } from '@/types/tool'

type ProfileUpdatePromptProps = {
  output: UpdateProfileOutput
  onApply: () => void
  onDismiss: () => void
}

type Translate = (key: DictKey) => string

// 변경 필드를 사람이 읽을 한 줄 요약으로 변환
const summarize = (updated: UpdateProfileOutput['updated'], t: Translate): string => {
  const parts: string[] = []
  if (updated.styles?.length) {
    const labels = updated.styles.map((s) => (STYLE_LABEL_KEYS[s] ? t(STYLE_LABEL_KEYS[s]) : s))
    parts.push(`${t('profileUpdate.styles')} ${labels.join(', ')}`)
  }
  if (updated.brands?.length) {
    const labels = updated.brands.map((b) => (BRAND_LABEL_KEYS[b] ? t(BRAND_LABEL_KEYS[b]) : b))
    parts.push(`${t('profileUpdate.brands')} ${labels.join(', ')}`)
  }
  if (updated.size) parts.push(`${t('profileUpdate.size')} ${updated.size}`)
  if (updated.budget) {
    const key = updated.budget.min !== undefined ? BUDGET_LABEL_KEYS[updated.budget.min] : undefined
    parts.push(`${t('profileUpdate.budget')} ${key ? t(key) : t('profileUpdate.changed')}`)
  }
  return parts.join(' · ')
}

// 대화 중 감지된 프로필 변경을 반영할지 확인하는 카드
const ProfileUpdatePrompt = ({ output, onApply, onDismiss }: ProfileUpdatePromptProps) => {
  const { t } = useLanguage()
  const summary = summarize(output.updated, t)

  return (
    <div className="mx-auto mb-2 w-full max-w-3xl px-4">
      <div className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{t('profileUpdate.title')}</p>
          <p className="text-muted-foreground truncate text-xs">{summary}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t('profileUpdate.later')}
        </Button>
        <Button size="sm" onClick={onApply}>
          {t('profileUpdate.apply')}
        </Button>
      </div>
    </div>
  )
}

export default ProfileUpdatePrompt
