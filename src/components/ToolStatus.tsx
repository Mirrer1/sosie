import { CheckIcon, LoaderIcon, TriangleAlertIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type ToolStatusProps = {
  toolType: string
  state: string
}

const TOOL_LABELS: Record<string, string> = {
  'tool-searchProducts': '무신사 상품 검색',
  'tool-comparePrices': '판매처 가격 비교',
  'tool-parseProductUrl': 'URL 정보 추출',
}

// AI Agent의 Tool 호출 단계를 사용자에게 노출
const ToolStatus = ({ toolType, state }: ToolStatusProps) => {
  const label = TOOL_LABELS[toolType] ?? toolType.replace('tool-', '')
  const isPending = state === 'input-streaming' || state === 'input-available'
  const isError = state === 'output-error'

  const Icon = isError ? TriangleAlertIcon : isPending ? LoaderIcon : CheckIcon
  const suffix = isPending ? ' 중...' : isError ? ' 실패' : ' 완료'

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
