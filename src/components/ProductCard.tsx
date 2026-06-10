import { type MarketProduct } from '@/types/product'

type ProductCardProps = {
  product: MarketProduct
}

// 단일 상품 카드
const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <a
      href={product.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card hover:bg-accent group flex flex-col overflow-hidden rounded-lg border transition-colors"
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
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{product.price.toLocaleString()}원</p>
          <p className="text-muted-foreground text-xs">{product.mall}</p>
        </div>
      </div>
    </a>
  )
}

export default ProductCard
