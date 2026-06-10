import { z } from 'zod'

// 네이버 쇼핑에서 가져온 무신사 입점 상품
export const marketProductSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().url(),
  productUrl: z.string().url(),
  mall: z.string(),
})

export type MarketProduct = z.infer<typeof marketProductSchema>
