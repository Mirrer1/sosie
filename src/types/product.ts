import { z } from 'zod'

// 큐레이션 카탈로그 상품 스키마
export const catalogProductSchema = z.object({
  id: z.string(),
  category: z.string(),
  brand: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().url(),
  productUrl: z.string().url(),
  tags: z.array(z.string()),
  description: z.string(),
})

export type CatalogProduct = z.infer<typeof catalogProductSchema>
