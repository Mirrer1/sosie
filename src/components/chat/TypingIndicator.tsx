import { LoaderIcon } from 'lucide-react'

// AI가 답변 시작 전 "생각 중" 표시
const TypingIndicator = () => {
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
      <span>생각 중...</span>
    </div>
  )
}

export default TypingIndicator
