import { type Profile } from '@/types/profile'

type BudgetFormat = {
  suffix: string // 통화 접미사
  orMore: string // 하한만 있을 때 붙일 접미사
  orLess: string // 상한만 있을 때 붙일 접미사
  formatApprox?: (krw: number) => string | null // 선택 언어 통화로 근사 환산
}

type BudgetParts = {
  main: string // 원화 금액 범위
  approx: string | null // 근사 환산 범위
}

// 예산 범위를 금액과 근사 환산 두 부분으로 분리
export const formatBudgetParts = (budget: Profile['budget'], opts: BudgetFormat): BudgetParts => {
  if (!budget) return { main: '', approx: null }
  const { min, max } = budget
  const hasMin = min !== undefined && min > 0
  const hasMax = max !== undefined
  if (!hasMin && !hasMax) return { main: '', approx: null }

  const won = (n: number) => `${n.toLocaleString()}${opts.suffix}`
  const approx = (n: number) => opts.formatApprox?.(n) ?? null

  if (hasMin && hasMax) {
    const a = approx(min)
    const b = approx(max)
    return { main: `${won(min)} ~ ${won(max)}`, approx: a && b ? `${a} – ${b}` : null }
  }
  if (hasMin) {
    return { main: `${won(min)} ${opts.orMore}`, approx: approx(min) }
  }
  return { main: `${won(max as number)} ${opts.orLess}`, approx: approx(max as number) }
}

// 예산 범위를 한 줄 문자열로 변환
export const formatBudgetRange = (budget: Profile['budget'], opts: BudgetFormat): string => {
  const { main, approx } = formatBudgetParts(budget, opts)
  if (!main) return ''
  return approx ? `${main} (≈ ${approx})` : main
}
