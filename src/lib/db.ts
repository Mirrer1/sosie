import { neon } from '@neondatabase/serverless'

// 요청 시점에 Neon 서버리스 SQL 클라이언트 생성
export const getSql = () => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL이 설정되지 않았습니다.')
  return neon(url)
}
