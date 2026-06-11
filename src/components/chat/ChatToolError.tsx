import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ChatToolErrorProps = {
  onRetry: () => void
  disabled?: boolean
}

// 도구 실행 실패 시 안내 화면
const ChatToolError = ({ onRetry, disabled }: ChatToolErrorProps) => {
  return (
    <div className="bg-card flex flex-col items-center gap-2 rounded-lg border p-5 text-center">
      <TriangleAlertIcon className="text-muted-foreground h-5 w-5" />
      <p className="text-sm">검색 중 문제가 생겼어요.</p>
      <p className="text-muted-foreground text-xs">잠시 후 다시 시도해 주세요.</p>
      <Button size="sm" variant="outline" onClick={onRetry} disabled={disabled} className="mt-1">
        <RotateCwIcon className="h-3.5 w-3.5" />
        다시 시도
      </Button>
    </div>
  )
}

export default ChatToolError
