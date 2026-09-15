import { type ProductRow } from '@/types/catalog'
import { type MarketProduct } from '@/types/product'

// DB 행을 화면용 상품으로 변환하고 링크는 직링크 이동 경로로 연결
export const rowToMarketProduct = (row: ProductRow): MarketProduct => ({
  id: row.id,
  brand: row.brand,
  name: row.name,
  price: row.price,
  imageUrl: row.image_url,
  productUrl: `/go/${encodeURIComponent(row.id)}`,
  mall: row.mall,
  styles: row.styles,
  subcategory: row.subcategory,
  gender: row.gender,
  colors: row.colors,
  materials: row.materials,
})
