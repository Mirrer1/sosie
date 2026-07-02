'use client'

import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/providers/LanguageProvider'

type ChatToolErrorProps = {
  onRetry: () => void
  disabled?: boolean
}

// 도구 실행 실패 시 안내 화면
const ChatToolError = ({ onRetry, disabled }: ChatToolErrorProps) => {
  const { t } = useLanguage()

  return (
    <div className="bg-card flex flex-col items-center gap-2 rounded-lg border p-5 text-center">
      <TriangleAlertIcon className="text-muted-foreground h-5 w-5" />
      <p className="text-sm">{t('toolError.title')}</p>
      <p className="text-muted-foreground text-xs">{t('toolError.desc')}</p>
      <Button size="sm" variant="outline" onClick={onRetry} disabled={disabled} className="mt-1">
        <RotateCwIcon className="h-3.5 w-3.5" />
        {t('toolError.retry')}
      </Button>
    </div>
  )
}

export default ChatToolError
