import { z } from 'zod'

import { catalogProductSchema } from './product'

// searchCatalog Tool 입력
export const searchCatalogInputSchema = z.object({
  category: z.string().optional().describe('카테고리 (예: 발마칸 코트, 와이드 진)'),
  keywords: z.array(z.string()).optional().describe('스타일 키워드 (예: 오버핏, 캐멀, 캐주얼)'),
  priceMin: z.number().int().nonnegative().optional(),
  priceMax: z.number().int().nonnegative().optional(),
})

// searchCatalog Tool 출력
export const searchCatalogOutputSchema = z.object({
  products: z.array(catalogProductSchema),
})

export type SearchCatalogInput = z.infer<typeof searchCatalogInputSchema>
export type SearchCatalogOutput = z.infer<typeof searchCatalogOutputSchema>
