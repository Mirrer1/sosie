'use client'

import { motion } from 'motion/react'
import { useState } from 'react'

import ProductCard from '@/components/product/ProductCard'
import ProductFavoriteButton from '@/components/product/ProductFavoriteButton'
import ProductPreviewDialog from '@/components/product/ProductPreviewDialog'
import { type MarketProduct } from '@/types/product'

type ProductGridProps = {
  products: MarketProduct[]
  onPreviewOpenChange?: (open: boolean) => void
}

// 상품 카드 반응형 그리드
const ProductGrid = ({ products, onPreviewOpenChange }: ProductGridProps) => {
  const [selected, setSelected] = useState<MarketProduct | null>(null)

  // 미리보기 열기
  const handleSelect = (product: MarketProduct) => {
    setSelected(product)
    onPreviewOpenChange?.(true)
  }

  // 미리보기 닫기
  const handleClose = () => {
    setSelected(null)
    onPreviewOpenChange?.(false)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: i * 0.05 }}
            className="relative h-full"
          >
            <ProductCard product={p} onClick={handleSelect} />
            <ProductFavoriteButton product={p} />
          </motion.div>
        ))}
      </div>
      <ProductPreviewDialog product={selected} onSelect={handleSelect} onClose={handleClose} />
    </>
  )
}

export default ProductGrid
