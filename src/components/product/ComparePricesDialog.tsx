'use client'

import { ExternalLinkIcon, LoaderIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/providers/LanguageProvider'
import { type ComparePricesOutput } from '@/types/tool'

type ComparePricesDialogProps = {
  product: {
    id: string
    name: string
    brand: string
    imageUrl: string
    productUrl: string
    mall: string
  } | null
  onClose: () => void
}

// 카드 클릭 시 열리는 판매처별 가격 비교 다이얼로그
const ComparePricesDialog = ({ product, onClose }: ComparePricesDialogProps) => {
  const { t } = useLanguage()
  const [sources, setSources] = useState<ComparePricesOutput['sources'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const cacheRef = useRef<Map<string, ComparePricesOutput['sources']>>(new Map())

  // 다이얼로그 열릴 때 가격 비교를 호출하며 같은 상품은 캐시 재사용
  useEffect(() => {
    if (!product) return

    const cached = cacheRef.current.get(product.id)
    if (cached) {
      setSources(cached)
      setError(null)
      setIsLoading(false)
      return
    }

    setSources(null)
    setError(null)
    setIsLoading(true)

    const ctrl = new AbortController()
    fetch('/api/compare-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: product.name, brand: product.brand }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? t('compare.error'))
        return data as ComparePricesOutput
      })
      .then((data) => {
        setSources(data.sources)
        cacheRef.current.set(product.id, data.sources)
      })
      .catch((e) => {
        if (e.name === 'AbortError') return
        setError(e.message ?? t('compare.error'))
      })
      .finally(() => setIsLoading(false))

    return () => ctrl.abort()
  }, [product, retryNonce, t])

  // 캐시 비우고 다시 요청
  const handleRetry = () => {
    if (product) cacheRef.current.delete(product.id)
    setRetryNonce((n) => n + 1)
  }

  const sortedSources = sources ? [...sources].sort((a, b) => a.price - b.price) : null
  const lowestSource = sortedSources?.[0]
  const lowestPrice = lowestSource?.price
  const lowestPriceText =
    lowestPrice !== undefined ? `${lowestPrice.toLocaleString()}${t('currency.suffix')}` : ''

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{t('compare.title')}</DialogTitle>
          <DialogDescription>{t('compare.desc')}</DialogDescription>
        </DialogHeader>

        {product && (
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
            <div className="bg-muted h-16 w-16 shrink-0 overflow-hidden rounded">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{product.brand}</p>
              <p className="line-clamp-2 text-sm">{product.name}</p>
            </div>
          </div>
        )}

        <div className="relative mt-1 max-h-[50vh] [scrollbar-gutter:stable] space-y-2 overflow-y-auto py-1">
          {isLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
              <LoaderIcon className="text-foreground h-6 w-6 animate-spin" />
              <span className="text-muted-foreground text-xs">{t('compare.loading')}</span>
            </div>
          )}
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-[58px] w-full rounded-lg" />
            ))}

          {error && !isLoading && (
            <div className="text-muted-foreground flex flex-col items-center gap-3 py-8 text-sm">
              <div className="text-destructive flex items-center gap-2">
                <TriangleAlertIcon className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCwIcon className="h-3.5 w-3.5" />
                {t('compare.retry')}
              </Button>
            </div>
          )}

          {!isLoading && !error && sortedSources && sortedSources.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">{t('compare.empty')}</p>
          )}

          {!isLoading &&
            !error &&
            sortedSources?.map((s, idx) => (
              <motion.a
                key={`${s.seller}-${idx}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut', delay: idx * 0.08 }}
                className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <p className="min-w-0 flex-1 truncate text-sm">{s.seller}</p>
                {s.price === lowestPrice && sortedSources.length > 1 && (
                  <span className="bg-primary text-primary-foreground mt-px shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                    {t('compare.lowest')}
                  </span>
                )}
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <p className="text-sm font-semibold">
                    {s.price.toLocaleString()}
                    {t('currency.suffix')}
                  </p>
                  {lowestPrice !== undefined && s.price !== lowestPrice && (
                    <p className="text-muted-foreground text-xs">
                      +{(s.price - lowestPrice).toLocaleString()}
                      {t('currency.suffix')}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" className="shrink-0" tabIndex={-1}>
                  <ExternalLinkIcon className="-mt-px h-3.5 w-3.5" />
                  {t('compare.buy')}
                </Button>
              </motion.a>
            ))}
        </div>

        {lowestSource && (
          <div className="border-t pt-3">
            <a
              href={lowestSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            >
              {t('compare.viewLowest').replace('{price}', lowestPriceText)}
              <ExternalLinkIcon className="-mt-px h-4 w-4" />
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ComparePricesDialog
