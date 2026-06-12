'use client'

import { EraserIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// 대화 내역 초기화
const ClearChatButton = () => {
  const [open, setOpen] = useState(false)

  // 확인 시 ChatRoot로 이벤트 전달 후 모달 닫기
  const handleConfirm = () => {
    window.dispatchEvent(new CustomEvent('sosie:clear-chat'))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="대화 지우기">
                  <EraserIcon className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>대화 지우기</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>대화 지우기</DialogTitle>
          <DialogDescription>현재 대화 내용을 모두 지웁니다. 되돌릴 수 없어요.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">취소</Button>} />
          <Button variant="destructive" onClick={handleConfirm}>
            지우기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClearChatButton
