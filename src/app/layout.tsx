import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'

import './globals.css'
import ThemeProvider from '@/components/layout/ThemeProvider'
import FavoritesProvider from '@/components/product/FavoritesProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import 'pretendard/dist/web/variable/pretendardvariable.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sosie-theta.vercel.app'
const TITLE = 'Sosie — 내 취향을 닮은 옷, 같이 골라드려요'
const DESCRIPTION = '프로필 기반으로 어울리는 옷을 골라주는 AI 패션 스타일리스트'
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION
const naverVerification = process.env.NAVER_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Sosie',
  openGraph: {
    type: 'website',
    siteName: 'Sosie',
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(naverVerification ? { other: { 'naver-site-verification': naverVerification } } : {}),
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex h-full flex-col overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <FavoritesProvider>
            <TooltipProvider delay={300}>{children}</TooltipProvider>
            <Toaster />
          </FavoritesProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

export default RootLayout
