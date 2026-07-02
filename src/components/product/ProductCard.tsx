'use client'

import { useLanguage } from '@/providers/LanguageProvider'
import { type MarketProduct } from '@/types/product'

type ProductCardProps = {
  product: MarketProduct
  onClick: (product: MarketProduct) => void
}

// 단일 상품 카드
const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { t } = useLanguage()

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
        </p>
      </div>
    </button>
  )
}

export default ProductCard
