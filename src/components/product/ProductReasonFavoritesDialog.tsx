'use client'

import { motion } from 'motion/react'

import ProductCard from '@/components/product/ProductCard'
import ProductFavoriteButton from '@/components/product/ProductFavoriteButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/providers/LanguageProvider'
import { type MarketProduct } from '@/types/product'

type ProductReasonFavoritesDialogProps = {
  products: MarketProduct[] | null
  onSelect: (product: MarketProduct) => void
  onClose: () => void
}

// 추천 이유 링크에서 열려 그 이유가 된 찜 상품만 미리보기 위에 보여주는 모달
const ProductReasonFavoritesDialog = ({
  products,
  onSelect,
  onClose,
}: ProductReasonFavoritesDialogProps) => {
  const { t } = useLanguage()

  return (
    <Dialog open={!!products} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{t('favorites.title')}</DialogTitle>
          <DialogDescription>{t('favorites.reasonDesc')}</DialogDescription>
        </DialogHeader>
        <div className="-mr-2 max-h-[60vh] overflow-y-auto py-1 pr-2">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut', delay: i * 0.05 }}
                  className="relative h-full"
                >
                  <ProductCard product={p} onClick={onSelect} />
                  <ProductFavoriteButton product={p} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-10 text-center text-sm">
              {t('favorites.empty')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductReasonFavoritesDialog
