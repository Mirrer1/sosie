'use client'

import { motion } from 'motion/react'
import { useState } from 'react'

import ComparePricesDialog from '@/components/product/ComparePricesDialog'
import ProductCard from '@/components/product/ProductCard'
import ProductFavoriteButton from '@/components/product/ProductFavoriteButton'
import { type MarketProduct } from '@/types/product'

type ProductGridProps = {
  products: MarketProduct[]
  onCompareOpenChange?: (open: boolean) => void
}

// 상품 카드 반응형 그리드
const ProductGrid = ({ products, onCompareOpenChange }: ProductGridProps) => {
  const [selected, setSelected] = useState<MarketProduct | null>(null)

  // 가격비교 대상을 선택하고 부모에 열림 알림
  const handleSelect = (product: MarketProduct) => {
    setSelected(product)
    onCompareOpenChange?.(true)
  }

  // 가격비교를 닫고 부모에 닫힘 알림
  const handleCompareClose = () => {
    setSelected(null)
    onCompareOpenChange?.(false)
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
      <ComparePricesDialog product={selected} onClose={handleCompareClose} />
    </>
  )
}

export default ProductGrid
