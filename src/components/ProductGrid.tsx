'use client'

import { motion } from 'motion/react'
import { useState } from 'react'

import ComparePricesDialog from '@/components/ComparePricesDialog'
import ProductCard from '@/components/ProductCard'
import { type MarketProduct } from '@/types/product'

type ProductGridProps = {
  products: MarketProduct[]
}

// 상품 카드 반응형 그리드
const ProductGrid = ({ products }: ProductGridProps) => {
  const [selected, setSelected] = useState<MarketProduct | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: i * 0.05 }}
            className="h-full"
          >
            <ProductCard product={p} onClick={setSelected} />
          </motion.div>
        ))}
      </div>
      <ComparePricesDialog product={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default ProductGrid
