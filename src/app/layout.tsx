import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'

import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import 'pretendard/dist/web/variable/pretendardvariable.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Sosie — 내 취향을 닮은 옷, 같이 골라드려요',
  description: '프로필 기반으로 무신사 풀에서 어울리는 옷을 골라주는 AI 패션 스타일리스트',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex h-full flex-col overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
