import { z } from 'zod'

// 수집 DB에서 가져온 패션 상품
export const marketProductSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().url(),
  productUrl: z.string(), // 구매 링크 이동 경로
  mall: z.string(),
  styles: z.array(z.string()).optional(), // AI가 태깅한 스타일
  subcategory: z.string().optional(), // AI가 태깅한 세부 품목
  gender: z.string().optional(), // 남성, 여성, 공용
  colors: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
})

export type MarketProduct = z.infer<typeof marketProductSchema>
