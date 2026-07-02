import { z } from 'zod'

// 사용자 프로필
export const profileSchema = z.object({
  styles: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  budget: z
    .object({
      min: z.number().int().nonnegative().optional(),
      max: z.number().int().nonnegative().optional(),
    })
    .optional(),
})

export type Profile = z.infer<typeof profileSchema>

export const STYLE_OPTIONS = [
  '캐주얼',
  '미니멀',
  '스트릿',
  '빈티지',
  '베이직',
  '스포티',
  '아메카지',
  '클래식',
  '고프코어',
]

export const POPULAR_BRANDS = [
  '무신사 스탠다드',
  '유니폼브릿지',
  '디스이즈네버댓',
  '커버낫',
  '앤더슨벨',
  '아이앱 스튜디오',
  '아디다스',
]

export const SIZE_OPTIONS: Array<Profile['size']> = ['XS', 'S', 'M', 'L', 'XL']

// 예산 슬라이더 설정값
export const BUDGET_MIN = 0
export const BUDGET_MAX = 1000000
export const BUDGET_STEP = 50000
