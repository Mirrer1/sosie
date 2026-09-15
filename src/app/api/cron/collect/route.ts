import { collectQuery, pickDueQueries, removeStaleProducts } from '@/lib/catalog/collect'

export const maxDuration = 300

const DAILY_QUERY_COUNT = 4

// Vercel Cron이 하루 한 번 호출해 오래된 검색어부터 수집하고 오래된 상품 정리
export const GET = async (req: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const queries = await pickDueQueries(DAILY_QUERY_COUNT)
  const settled = await Promise.allSettled(queries.map(collectQuery))
  const removed = await removeStaleProducts()

  const results = settled.map((result, index) =>
    result.status === 'fulfilled'
      ? result.value
      : { query: queries[index], error: String(result.reason) },
  )
  return Response.json({ results, removed })
}
