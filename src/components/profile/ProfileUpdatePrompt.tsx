'use client'

import { Button } from '@/components/ui/button'
import { BUDGET_RANGES } from '@/types/profile'
import { type UpdateProfileOutput } from '@/types/tool'

type ProfileUpdatePromptProps = {
  output: UpdateProfileOutput
  onApply: () => void
  onDismiss: () => void
}

// 변경 필드를 사람이 읽을 한 줄 요약으로 변환
const summarize = (updated: UpdateProfileOutput['updated']): string => {
  const parts: string[] = []
  if (updated.styles?.length) parts.push(`스타일 ${updated.styles.join(', ')}`)
  if (updated.brands?.length) parts.push(`브랜드 ${updated.brands.join(', ')}`)
  if (updated.size) parts.push(`사이즈 ${updated.size}`)
  if (updated.budget) {
    const range = BUDGET_RANGES.find(
      (r) => r.min === updated.budget?.min && r.max === updated.budget?.max,
    )
    parts.push(`예산 ${range ? range.label : '변경'}`)
  }
  return parts.join(' · ')
}

// 대화 중 감지된 프로필 변경을 반영할지 확인하는 카드
const ProfileUpdatePrompt = ({ output, onApply, onDismiss }: ProfileUpdatePromptProps) => {
  const summary = summarize(output.updated)

  return (
    <div className="mx-auto mb-2 w-full max-w-3xl px-4">
      <div className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">프로필에 반영할까요?</p>
          <p className="text-muted-foreground truncate text-xs">{summary}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          나중에
        </Button>
        <Button size="sm" onClick={onApply}>
          반영
        </Button>
      </div>
    </div>
  )
}

export default ProfileUpdatePrompt
