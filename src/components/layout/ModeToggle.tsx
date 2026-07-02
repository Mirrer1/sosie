'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLanguage } from '@/providers/LanguageProvider'

// 테마 모드 토글
const ModeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useLanguage()

  // 테마 전환
  const handleToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t('header.theme')} onClick={handleToggle}>
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        }
      />
      <TooltipContent>{t('header.theme')}</TooltipContent>
    </Tooltip>
  )
}

export default ModeToggle
