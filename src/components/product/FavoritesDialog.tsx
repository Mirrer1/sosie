'use client'

import { useState } from 'react'

import { useFavorites } from '@/components/product/FavoritesProvider'
import ProductGrid from '@/components/product/ProductGrid'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type FavoritesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 찜한 상품 목록 모달
const FavoritesDialog = ({ open, onOpenChange }: FavoritesDialogProps) => {
  const { favorites } = useFavorites()
  const [compareOpen, setCompareOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('max-w-lg sm:max-w-lg', compareOpen && 'pointer-events-none opacity-0')}
      >
        <DialogHeader>
          <DialogTitle className="text-base">찜한 상품</DialogTitle>
          <DialogDescription>마음에 들어 저장한 상품이에요.</DialogDescription>
        </DialogHeader>
        <div className="-mr-2 max-h-[60vh] overflow-y-auto py-1 pr-2">
          {favorites.length > 0 ? (
            <ProductGrid products={favorites} onCompareOpenChange={setCompareOpen} />
          ) : (
            <p className="text-muted-foreground py-10 text-center text-sm">
              아직 찜한 상품이 없어요. 카드의 하트를 눌러 저장해 보세요.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FavoritesDialog
