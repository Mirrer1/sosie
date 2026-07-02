'use client'

import { HeartIcon } from 'lucide-react'
import { type MouseEvent } from 'react'

import { cn } from '@/lib/utils'
import { useFavorites } from '@/providers/FavoritesProvider'
import { useLanguage } from '@/providers/LanguageProvider'
import { type MarketProduct } from '@/types/product'

type ProductFavoriteButtonProps = {
  product: MarketProduct
}

// 상품 카드 위에 올라가는 찜 토글 버튼
const ProductFavoriteButton = ({ product }: ProductFavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { t } = useLanguage()
  const active = isFavorite(product.id)

  // 카드 클릭과 분리하려 이벤트 전파 차단
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    toggleFavorite(product)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? t('favorites.remove') : t('favorites.add')}
      aria-pressed={active}
      className="bg-background/80 hover:bg-background absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition-colors"
    >
      <HeartIcon className={cn('h-4 w-4', active && 'fill-red-500 text-red-500')} />
    </button>
  )
}

export default ProductFavoriteButton
