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
import useChatBusy from '@/hooks/useChatBusy'
import { useLanguage } from '@/providers/LanguageProvider'

// 대화 내역 초기화
const ClearChatButton = () => {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const busy = useChatBusy()

  // 응답 중 모달 열림 차단
  const handleOpenChange = (next: boolean) => {
    if (next && busy) return
    setOpen(next)
  }

  // 확인 시 ChatRoot로 이벤트 전달 후 모달 닫기
  const handleConfirm = () => {
    window.dispatchEvent(new CustomEvent('sosie:clear-chat'))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={t('clearChat.label')}>
                  <EraserIcon className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>{t('clearChat.label')}</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('clearChat.label')}</DialogTitle>
          <DialogDescription>{t('clearChat.desc')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">{t('clearChat.cancel')}</Button>} />
          <Button variant="destructive" onClick={handleConfirm}>
            {t('clearChat.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClearChatButton
