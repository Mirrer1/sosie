'use client'

import { useExchangeRate } from '@/providers/ExchangeRateProvider'
import { useLanguage } from '@/providers/LanguageProvider'
import { type MarketProduct } from '@/types/product'

type ProductCardProps = {
  product: MarketProduct
  onClick: (product: MarketProduct) => void
}

// 단일 상품 카드
const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { t } = useLanguage()
  const { formatApprox } = useExchangeRate()
  const approx = formatApprox(product.price)

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="bg-card hover:bg-accent group flex h-full flex-col overflow-hidden rounded-lg border text-left transition-colors"
    >
      <div className="bg-muted aspect-square overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-muted-foreground text-xs">{product.brand}</p>
        <p className="line-clamp-2 text-sm leading-snug">{product.name}</p>
        <p className="mt-auto text-sm font-semibold">
          {product.price.toLocaleString()}
          {t('currency.suffix')}
          {approx && (
            <span className="text-muted-foreground ml-1 text-xs font-normal">(≈ {approx})</span>
          )}
        </p>
      </div>
    </button>
  )
}

export default ProductCard
