'use client'

import { UserCogIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import useChatBusy from '@/hooks/useChatBusy'
import { useLanguage } from '@/providers/LanguageProvider'

// 프로필 수정 열기
const EditProfileButton = () => {
  const { t } = useLanguage()
  const busy = useChatBusy()

  // 응답 중 클릭 무시
  const handleClick = () => {
    if (busy) return
    window.dispatchEvent(new CustomEvent('sosie:open-profile'))
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t('profile.edit')} onClick={handleClick}>
            <UserCogIcon className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        }
      />
      <TooltipContent>{t('profile.edit')}</TooltipContent>
    </Tooltip>
  )
}

export default EditProfileButton
