'use client'

import { CheckIcon, LoaderIcon, TriangleAlertIcon } from 'lucide-react'

import { type DictKey } from '@/i18n/dictionaries'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/providers/LanguageProvider'

type ToolStatusProps = {
  toolType: string
  state: string
}

const TOOL_LABEL_KEYS: Record<string, DictKey> = {
  'tool-searchProducts': 'toolStatus.searchProducts',
  'tool-comparePrices': 'toolStatus.comparePrices',
  'tool-parseProductUrl': 'toolStatus.parseProductUrl',
  'tool-updateProfile': 'toolStatus.updateProfile',
}

// AI Agent의 Tool 호출 단계를 사용자에게 노출
const ToolStatus = ({ toolType, state }: ToolStatusProps) => {
  const { t } = useLanguage()
  const labelKey = TOOL_LABEL_KEYS[toolType]
  const label = labelKey ? t(labelKey) : toolType.replace('tool-', '')
  const isPending = state === 'input-streaming' || state === 'input-available'
  const isError = state === 'output-error'

  const Icon = isError ? TriangleAlertIcon : isPending ? LoaderIcon : CheckIcon
  const suffix = isPending
    ? t('toolStatus.pending')
    : isError
      ? t('toolStatus.error')
      : t('toolStatus.done')

  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Icon className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
      <span>
        {label}
        {suffix}
      </span>
    </div>
  )
}

export default ToolStatus
