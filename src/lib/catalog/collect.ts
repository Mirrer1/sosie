import { COLLECT_QUERIES } from '@/lib/catalog/collectQueries'
import { isSupportedMall, normalizeMall } from '@/lib/catalog/malls'
import { type ShoppingResult, searchGoogleShopping } from '@/lib/catalog/serpApi'
import { type ProductTag, tagProducts } from '@/lib/catalog/tagProducts'
import { getSql } from '@/lib/db'

const NOISE_KEYWORDS = ['중고', '리퍼', '렌탈', '대여', '도매', '사은품', '구매대행']
const STALE_DAYS = 60

export type CollectedItem = {
  id: string
  title: string
  price: number
  imageUrl: string
  mall: string
  productLink: string
  immersiveToken: string | null
}

export type CollectSummary = {
  query: string
  fetched: number
  updated: number
  inserted: number
}

// 공백을 없애고 소문자로 정규화
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()

// 구글 쇼핑 결과를 수집 항목으로 변환
export const mapShoppingResult = (result: ShoppingResult): CollectedItem | null => {
  if (!result.product_id || !result.title || !result.thumbnail || !result.product_link) return null
  if (!result.source || !result.extracted_price || result.extracted_price <= 0) return null
  return {
    id: result.product_id,
    title: result.title.trim(),
    price: Math.round(result.extracted_price),
    imageUrl: result.thumbnail,
    mall: normalizeMall(result.source),
    productLink: result.product_link,
    immersiveToken: result.immersive_product_page_token ?? null,
  }
}

// 노이즈 상품명 여부
export const isNoiseTitle = (title: string): boolean =>
  NOISE_KEYWORDS.some((keyword) => title.includes(keyword))

// 지원 판매처의 패션 상품만 저장
export const shouldStore = (item: CollectedItem, tag: ProductTag): boolean =>
  tag.isFashion && !isNoiseTitle(item.title) && isSupportedMall(item.mall)

// 정규화한 검색 문자열 생성
export const buildSearchText = (item: CollectedItem, tag: ProductTag): string =>
  normalize(
    [
      tag.brand,
      tag.name,
      item.title,
      tag.category,
      tag.subcategory,
      ...tag.keywords,
      ...tag.colors,
      ...tag.materials,
      ...tag.styles,
    ].join(' '),
  )

// 검색어 하나를 수집해 기존 상품은 갱신하고 새 상품만 태깅해 저장
export const collectQuery = async (query: string): Promise<CollectSummary> => {
  const sql = getSql()
  const results = await searchGoogleShopping(query)
  const items = [
    ...new Map(
      results
        .map(mapShoppingResult)
        .filter((item): item is CollectedItem => item !== null && isSupportedMall(item.mall))
        .map((item) => [item.id, item]),
    ).values(),
  ]

  const existingRows = await sql.query('select id from products where id = any($1)', [
    items.map((item) => item.id),
  ])
  const existingIds = new Set(existingRows.map((row) => row.id as string))
  const seen = items.filter((item) => existingIds.has(item.id))
  const fresh = items.filter((item) => !existingIds.has(item.id))

  if (seen.length > 0) {
    await sql.query(
      `update products p set
        price = r.price,
        image_url = r.image_url,
        product_link = r.product_link,
        immersive_token = coalesce(r.immersive_token, p.immersive_token),
        price_updated_at = case when p.price <> r.price then now() else p.price_updated_at end,
        last_seen_at = now()
      from jsonb_to_recordset($1::jsonb) as r(id text, price integer, image_url text, product_link text, immersive_token text)
      where p.id = r.id`,
      [
        JSON.stringify(
          seen.map((item) => ({
            id: item.id,
            price: item.price,
            image_url: item.imageUrl,
            product_link: item.productLink,
            immersive_token: item.immersiveToken,
          })),
        ),
      ],
    )
  }

  let inserted = 0
  if (fresh.length > 0) {
    const tags = await tagProducts(fresh)
    const rows = fresh.flatMap((item, index) => {
      const tag = tags.get(index)
      if (!tag || !shouldStore(item, tag)) return []
      return [
        {
          id: item.id,
          title: item.title,
          name: tag.name.trim() || item.title,
          brand: tag.brand.trim() || item.mall,
          price: item.price,
          image_url: item.imageUrl,
          mall: item.mall,
          category: tag.category,
          subcategory: tag.subcategory,
          gender: tag.gender,
          colors: tag.colors,
          materials: tag.materials,
          styles: tag.styles,
          keywords: tag.keywords,
          search_text: buildSearchText(item, tag),
          product_link: item.productLink,
          immersive_token: item.immersiveToken,
        },
      ]
    })

    if (rows.length > 0) {
      await sql.query(
        `insert into products (id, title, name, brand, price, image_url, mall, category, subcategory, gender,
          colors, materials, styles, keywords, search_text, product_link, immersive_token)
        select id, title, name, brand, price, image_url, mall, category, subcategory, gender,
          colors, materials, styles, keywords, search_text, product_link, immersive_token
        from jsonb_to_recordset($1::jsonb) as r(id text, title text, name text, brand text, price integer,
          image_url text, mall text, category text, subcategory text, gender text, colors text[],
          materials text[], styles text[], keywords text[], search_text text, product_link text,
          immersive_token text)
        on conflict (id) do nothing`,
        [JSON.stringify(rows)],
      )
      inserted = rows.length
    }
  }

  await sql.query(
    `insert into collect_queries (query, last_run_at, last_count) values ($1, now(), $2)
    on conflict (query) do update set last_run_at = now(), last_count = $2`,
    [query, items.length],
  )

  return { query, fetched: items.length, updated: seen.length, inserted }
}

// 오래된 검색어부터 선택
export const pickDueQueries = async (count: number): Promise<string[]> => {
  const sql = getSql()
  await sql.query(
    'insert into collect_queries (query) select unnest($1::text[]) on conflict (query) do nothing',
    [COLLECT_QUERIES],
  )
  const rows = await sql.query(
    `select query from collect_queries where query = any($1)
    order by last_run_at asc nulls first limit $2`,
    [COLLECT_QUERIES, count],
  )
  return rows.map((row) => row.query as string)
}

// 오랫동안 다시 발견되지 않은 상품 삭제
export const removeStaleProducts = async (): Promise<number> => {
  const sql = getSql()
  const rows = await sql.query(
    `delete from products where last_seen_at < now() - ($1 || ' days')::interval returning id`,
    [String(STALE_DAYS)],
  )
  return rows.length
}
