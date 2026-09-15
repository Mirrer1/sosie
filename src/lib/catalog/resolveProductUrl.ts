import { normalizeMall, toWebProductUrl } from '@/lib/catalog/malls'
import { fetchImmersiveStores } from '@/lib/catalog/serpApi'
import { getSql } from '@/lib/db'

type LinkRow = {
  mall: string
  product_link: string
  immersive_token: string | null
  direct_url: string | null
}

// 저장된 직링크를 쓰고 없으면 판매처를 조회해 저장하며 실패하면 구글 상품 페이지로 대체
export const resolveProductUrl = async (id: string): Promise<string | null> => {
  const sql = getSql()
  const rows = (await sql.query(
    'select mall, product_link, immersive_token, direct_url from products where id = $1',
    [id],
  )) as LinkRow[]
  const row = rows[0]
  if (!row) return null
  if (row.direct_url) return row.direct_url
  if (!row.immersive_token) return row.product_link

  try {
    const stores = await fetchImmersiveStores(row.immersive_token)
    const store =
      stores.find((s) => s.link && s.name && normalizeMall(s.name) === row.mall) ??
      stores.find((s) => s.link)
    if (!store?.link) return row.product_link

    const directUrl = toWebProductUrl(store.link)
    await sql.query('update products set direct_url = $1 where id = $2', [directUrl, id])
    return directUrl
  } catch {
    return row.product_link
  }
}
