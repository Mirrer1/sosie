'use client'

import { CopyIcon, RotateCwIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type ChatMessageActionsProps = {
  text: string
  onRegenerate?: () => void
}

// AI 답변 하단의 복사와 새로고침 액션
const ChatMessageActions = ({ text, onRegenerate }: ChatMessageActionsProps) => {
  // 답변 텍스트를 클립보드로 복사
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('복사했어요')
    } catch {
      toast.error('복사하지 못했어요')
    }
  }

  return (
    <div className="text-muted-foreground flex items-center gap-0.5 pl-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={handleCopy}
              aria-label="복사"
              className="hover:bg-accent hover:text-foreground cursor-pointer rounded-md p-1.5 transition-colors"
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </button>
          }
        />
        <TooltipContent>복사</TooltipContent>
      </Tooltip>
      {onRegenerate && (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={onRegenerate}
                aria-label="다시 생성"
                className="hover:bg-accent hover:text-foreground cursor-pointer rounded-md p-1.5 transition-colors"
              >
                <RotateCwIcon className="h-3.5 w-3.5" />
              </button>
            }
          />
          <TooltipContent>다시 생성</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export default ChatMessageActions
