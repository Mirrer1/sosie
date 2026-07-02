'use client'

import { useState } from 'react'

import ProductGrid from '@/components/product/ProductGrid'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/providers/FavoritesProvider'
import { useLanguage } from '@/providers/LanguageProvider'

type FavoritesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 찜한 상품 목록 모달
const FavoritesDialog = ({ open, onOpenChange }: FavoritesDialogProps) => {
  const { favorites } = useFavorites()
  const { t } = useLanguage()
  const [compareOpen, setCompareOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('max-w-lg sm:max-w-lg', compareOpen && 'pointer-events-none opacity-0')}
      >
        <DialogHeader>
          <DialogTitle className="text-base">{t('favorites.title')}</DialogTitle>
          <DialogDescription>{t('favorites.desc')}</DialogDescription>
        </DialogHeader>
        <div className="-mr-2 max-h-[60vh] overflow-y-auto py-1 pr-2">
          {favorites.length > 0 ? (
            <ProductGrid products={favorites} onCompareOpenChange={setCompareOpen} />
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

export default FavoritesDialog
