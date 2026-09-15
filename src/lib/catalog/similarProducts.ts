import { rowToMarketProduct } from '@/lib/catalog/mapProduct'
import { getSql } from '@/lib/db'
import { type ProductRow } from '@/types/catalog'
import { type MarketProduct } from '@/types/product'

const SIMILAR_LIMIT = 8

// 기준 상품과 같은 카테고리에서 세부 품목, 스타일 겹침, 가격 차이 순으로 비슷한 상품 조회
export const findSimilarProducts = async (id: string): Promise<MarketProduct[]> => {
  const sql = getSql()
  const [base] = (await sql.query('select * from products where id = $1', [id])) as ProductRow[]
  if (!base) return []

  const rows = (await sql.query(
    `select * from products p
    where p.id <> $1
      and p.category = $2
      and ($3 <> '무신사' or p.mall = '무신사')
      and not (p.brand = $4 and p.name = $5)
      and p.gender in ($6, '공용')
    order by
      (case when p.subcategory = $7 then 1 else 0 end) desc,
      (select count(*) from unnest(p.styles) s where s = any($8::text[])) desc,
      abs(p.price - $9) asc
    limit $10`,
    [
      base.id,
      base.category,
      base.mall,
      base.brand,
      base.name,
      base.gender,
      base.subcategory,
      base.styles,
      base.price,
      SIMILAR_LIMIT,
    ],
  )) as ProductRow[]

  return rows.map(rowToMarketProduct)
}
