'use client'

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
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onClick={setSelected} />
        ))}
      </div>
      <ComparePricesDialog product={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default ProductGrid
