import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { getSql } from '@/lib/db'

// schema.sql 구문을 순서대로 실행해 테이블과 인덱스 생성
const main = async () => {
  const sql = getSql()
  const schema = readFileSync(join(process.cwd(), 'src/lib/catalog/schema.sql'), 'utf8')
  const statements = schema
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql.query(statement)
  }
  console.log(`스키마 적용 완료: 구문 ${statements.length}개`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
