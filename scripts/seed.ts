import { collectQuery, pickDueQueries } from '@/lib/catalog/collect'
import { getSql } from '@/lib/db'

const DEFAULT_LIMIT = 10
const MIN_INTERVAL_MS = 75000
const RATE_LIMIT_WAIT_MS = 600000
const RETRY_WAIT_MS = 30000

// 지정한 시간만큼 대기
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 일시 오류면 잠시 뒤 한 번 더 수집
const collectWithRetry = async (query: string) => {
  try {
    return await collectQuery(query)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('429')) await sleep(RATE_LIMIT_WAIT_MS)
    else await sleep(RETRY_WAIT_MS)
    return collectQuery(query)
  }
}

// 무료 플랜 시간당 호출 한도에 맞춰 검색어를 하나씩 수집
const main = async () => {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : DEFAULT_LIMIT
  const queries = await pickDueQueries(limit)
  console.log(`수집 시작: 검색어 ${queries.length}개`)

  for (const [index, query] of queries.entries()) {
    const startedAt = Date.now()
    try {
      const summary = await collectWithRetry(query)
      console.log(
        `[${index + 1}/${queries.length}] ${query} 조회 ${summary.fetched} 갱신 ${summary.updated} 추가 ${summary.inserted} (${Math.round((Date.now() - startedAt) / 1000)}초)`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(`[${index + 1}/${queries.length}] ${query} 실패: ${message}`)
    }
    const elapsed = Date.now() - startedAt
    if (index < queries.length - 1 && elapsed < MIN_INTERVAL_MS)
      await sleep(MIN_INTERVAL_MS - elapsed)
  }

  const [stats] = await getSql().query(
    `select count(*)::int as total, count(*) filter (where mall = '무신사')::int as musinsa,
      count(distinct mall)::int as malls from products`,
  )
  console.log(`DB 현황: 전체 ${stats.total} 무신사 ${stats.musinsa} 판매처 ${stats.malls}곳`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
