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
  product: { name: string; productUrl: string; mall: string } | null
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
      body: JSON.stringify({ productName: product.name }),
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
  const lowestPrice = sortedSources?.[0]?.price

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="line-clamp-2 pr-8 text-base">
            {product?.name ?? '가격 비교'}
          </DialogTitle>
          <DialogDescription>여러 판매처에서 찾은 비슷한 상품의 가격이에요.</DialogDescription>
        </DialogHeader>

        <div className="-mr-2 max-h-[60vh] space-y-2 overflow-y-auto py-2 pr-2">
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
                <div className="bg-muted h-14 w-14 shrink-0 overflow-hidden rounded">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.seller} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-muted-foreground text-xs">{s.seller}</p>
                  <p className="line-clamp-2 text-sm">{s.title ?? product?.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{s.price.toLocaleString()}원</p>
                    {s.price === lowestPrice && sortedSources.length > 1 && (
                      <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                        최저가
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" tabIndex={-1}>
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  구매
                </Button>
              </a>
            ))}
        </div>

        {product?.productUrl && (
          <div className="border-t pt-3">
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 text-xs"
            >
              원본({product.mall})으로 이동
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ComparePricesDialog
