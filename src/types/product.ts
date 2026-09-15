import { z } from 'zod'

// 수집 DB에서 가져온 패션 상품
export const marketProductSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().url(),
  productUrl: z.string(), // 직링크로 이동하는 내부 경로
  mall: z.string(),
  styles: z.array(z.string()).optional(), // AI가 태깅한 스타일
})

export type MarketProduct = z.infer<typeof marketProductSchema>
