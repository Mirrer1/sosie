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
  '포멀',
  '아메카지',
]

export const POPULAR_BRANDS = [
  '무신사 스탠다드',
  '유니폼브릿지',
  '디스이즈네버댓',
  '커버낫',
  '앤더슨벨',
  '아이앱 스튜디오',
  '아디다스',
  '나이키',
]

export const SIZE_OPTIONS: Array<Profile['size']> = ['XS', 'S', 'M', 'L', 'XL']

export const BUDGET_RANGES = [
  { label: '5만원 이하', min: 0, max: 50000 },
  { label: '5~15만원', min: 50000, max: 150000 },
  { label: '15~30만원', min: 150000, max: 300000 },
  { label: '30만원 이상', min: 300000, max: undefined },
]
