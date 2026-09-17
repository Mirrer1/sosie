import { buildMallSearchUrl, isMallUrl, toWebProductUrl } from '@/lib/catalog/malls'
import { type ImmersiveStore, fetchImmersiveStores } from '@/lib/catalog/serpApi'
import { getSql } from '@/lib/db'

const TOKEN_FRESH_MS = 24 * 60 * 60 * 1000

type LinkRow = {
  brand: string
  name: string
  mall: string
  immersive_token: string | null
  direct_url: string | null
  last_seen_at: string
}

// 판매처 조회 토큰 유효 여부
export const isTokenFresh = (lastSeenAt: string | Date, now = Date.now()): boolean =>
  now - new Date(lastSeenAt).getTime() < TOKEN_FRESH_MS

// 판매처 목록에서 같은 판매처 링크 선택
export const pickStoreLink = (stores: ImmersiveStore[], mall: string): string | null => {
  const urls = stores.flatMap((store) => (store.link ? [toWebProductUrl(store.link)] : []))
  return urls.find((url) => isMallUrl(url, mall)) ?? null
}

// 저장 링크, 토큰 조회, 판매처 검색 순으로 이동할 주소 결정
export const resolveProductUrl = async (id: string): Promise<string | null> => {
  const sql = getSql()
  const rows = (await sql.query(
    'select brand, name, mall, immersive_token, direct_url, last_seen_at from products where id = $1',
    [id],
  )) as LinkRow[]
  const row = rows[0]
  if (!row) return null
  if (row.direct_url && isMallUrl(row.direct_url, row.mall)) return row.direct_url

  const fallback = buildMallSearchUrl(row)
  if (!row.immersive_token || !isTokenFresh(row.last_seen_at)) return fallback

  try {
    const directUrl = pickStoreLink(await fetchImmersiveStores(row.immersive_token), row.mall)
    if (!directUrl) return fallback
    await sql.query('update products set direct_url = $1 where id = $2', [directUrl, id])
    return directUrl
  } catch {
    return fallback
  }
}
