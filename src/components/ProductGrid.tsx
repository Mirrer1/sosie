import ProductCard from '@/components/ProductCard'
import { type MarketProduct } from '@/types/product'

type ProductGridProps = {
  products: MarketProduct[]
}

// 상품 카드 반응형 그리드
const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

export default ProductGrid
