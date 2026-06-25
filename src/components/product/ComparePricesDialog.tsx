'use client'

import { ExternalLinkIcon, LoaderIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type ComparePricesOutput } from '@/types/tool'

type ComparePricesDialogProps = {
  product: {
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
  const [sources, setSources] = useState<ComparePricesOutput['sources'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 다이얼로그 열릴 때마다 가격 비교 API 호출
  useEffect(() => {
    if (!product) return
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
        if (!res.ok) throw new Error(data?.error ?? '가격 비교 실패')
        return data as ComparePricesOutput
      })
      .then((data) => {
        setSources(data.sources)
      })
      .catch((e) => {
        if (e.name === 'AbortError') return
        setError(e.message ?? '가격 비교 실패')
      })
      .finally(() => setIsLoading(false))

    return () => ctrl.abort()
  }, [product])

  const sortedSources = sources ? [...sources].sort((a, b) => a.price - b.price) : null
  const lowestSource = sortedSources?.[0]
  const lowestPrice = lowestSource?.price

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">가격 비교</DialogTitle>
          <DialogDescription>여러 판매처에서 찾은 같은 상품의 가격이에요.</DialogDescription>
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

        <div className="mt-1 -mr-2 max-h-[50vh] space-y-2 overflow-y-auto py-1 pr-2">
          {isLoading && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-sm">
              <LoaderIcon className="h-5 w-5 animate-spin" />
              <span>판매처 가격을 모으는 중...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="text-destructive flex flex-col items-center gap-2 py-8 text-sm">
              <TriangleAlertIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && sortedSources && sortedSources.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              매칭되는 판매처 결과를 못 찾았어요.
            </p>
          )}

          {!isLoading &&
            !error &&
            sortedSources?.map((s, idx) => (
              <a
                key={`${s.seller}-${idx}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <p className="min-w-0 flex-1 truncate text-sm">{s.seller}</p>
                {s.price === lowestPrice && sortedSources.length > 1 && (
                  <span className="bg-primary text-primary-foreground mt-px shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                    최저가
                  </span>
                )}
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <p className="text-sm font-semibold">{s.price.toLocaleString()}원</p>
                  {lowestPrice !== undefined && s.price !== lowestPrice && (
                    <p className="text-muted-foreground text-xs">
                      +{(s.price - lowestPrice).toLocaleString()}원
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" className="shrink-0" tabIndex={-1}>
                  <ExternalLinkIcon className="-mt-px h-3.5 w-3.5" />
                  구매
                </Button>
              </a>
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
              최저가 {lowestPrice?.toLocaleString()}원으로 구매
              <ExternalLinkIcon className="-mt-px h-4 w-4" />
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ComparePricesDialog
