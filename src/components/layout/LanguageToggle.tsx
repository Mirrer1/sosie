'use client'

import { LanguagesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LANGUAGES, type LanguageCode } from '@/i18n/languages'
import { useLanguage } from '@/providers/LanguageProvider'

// 헤더의 UI 언어 선택 드롭다운
const LanguageToggle = () => {
  const { lang, setLang, t } = useLanguage()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={t('header.language')}>
                  <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>{t('header.language')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={lang}
          onValueChange={(value) => setLang(value as LanguageCode)}
        >
          {LANGUAGES.map((item) => (
            <DropdownMenuRadioItem key={item.code} value={item.code} closeOnClick>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageToggle
