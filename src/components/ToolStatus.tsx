import { cn } from '@/lib/utils'

type ToolStatusProps = {
  toolType: string
  state: string
}

const TOOL_LABELS: Record<string, string> = {
  'tool-searchCatalog': '카탈로그 검색',
}

// AI Agent의 Tool 호출 단계를 사용자에게 노출
const ToolStatus = ({ toolType, state }: ToolStatusProps) => {
  const label = TOOL_LABELS[toolType] ?? toolType.replace('tool-', '')
  const isPending = state === 'input-streaming' || state === 'input-available'
  const isError = state === 'output-error'
  const icon = isError ? '⚠' : isPending ? '🔧' : '✓'
  const suffix = isPending ? ' 중...' : isError ? ' 실패' : ' 완료'

  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center gap-1.5 text-xs',
        isPending && 'animate-pulse',
      )}
    >
      <span>{icon}</span>
      <span>
        {label}
        {suffix}
      </span>
    </div>
  )
}

export default ToolStatus
