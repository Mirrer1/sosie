import { SUPPORTED_MALL_NAMES } from '@/lib/catalog/malls'
import { rowToMarketProduct } from '@/lib/catalog/mapProduct'
import { getSql } from '@/lib/db'
import { type ProductRow } from '@/types/catalog'
import { type MarketProduct } from '@/types/product'

const SIMILAR_LIMIT = 8

// 같은 카테고리와 성별에서 비슷한 상품 조회
export const findSimilarProducts = async (id: string): Promise<MarketProduct[]> => {
  const sql = getSql()
  const [base] = (await sql.query('select * from products where id = $1', [id])) as ProductRow[]
  if (!base) return []

  const rows = (await sql.query(
    `select * from products p
    where p.id <> $1
      and (case when $10 = '무신사' then p.mall = '무신사' else p.mall = any($11::text[]) end)
      and p.category = $2
      and not (p.brand = $3 and p.name = $4)
      and p.gender in ($5, '공용')
    order by
      (case when p.subcategory = $6 then 1 else 0 end) desc,
      (select count(*) from unnest(p.styles) s where s = any($7::text[])) desc,
      abs(p.price - $8) asc
    limit $9`,
    [
      base.id,
      base.category,
      base.brand,
      base.name,
      base.gender,
      base.subcategory,
      base.styles,
      base.price,
      SIMILAR_LIMIT,
      base.mall,
      SUPPORTED_MALL_NAMES,
    ],
  )) as ProductRow[]

  return rows.map(rowToMarketProduct)
}
