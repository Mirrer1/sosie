import { type ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import FavoritesProvider from '@/providers/FavoritesProvider'
import LanguageProvider from '@/providers/LanguageProvider'
import ThemeProvider from '@/providers/ThemeProvider'

// 앱 전역 프로바이더를 한곳에서 조립
const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <FavoritesProvider>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
          <Toaster />
        </FavoritesProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default AppProviders
