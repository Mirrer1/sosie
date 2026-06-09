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

// comparePrices Tool 입력
export const comparePricesInputSchema = z.object({
  productName: z.string().describe('상품명 (예: "유니폼브릿지 발마칸 싱글 코트")'),
})

// comparePrices Tool 출력
export const comparePricesOutputSchema = z.object({
  sources: z.array(
    z.object({
      seller: z.string(),
      price: z.number().int().nonnegative(),
      url: z.string().url(),
      imageUrl: z.string().url().optional(),
      title: z.string().optional(),
    }),
  ),
})

export type ComparePricesInput = z.infer<typeof comparePricesInputSchema>
export type ComparePricesOutput = z.infer<typeof comparePricesOutputSchema>

// parseProductUrl Tool 입력
export const parseProductUrlInputSchema = z.object({
  url: z.string().url().describe('상품 페이지 URL (무신사/29CM/공식몰 등)'),
})

// parseProductUrl Tool 출력
export const parseProductUrlOutputSchema = z.object({
  title: z.string(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  siteName: z.string().optional(),
  sourceUrl: z.string().url(),
})

export type ParseProductUrlInput = z.infer<typeof parseProductUrlInputSchema>
export type ParseProductUrlOutput = z.infer<typeof parseProductUrlOutputSchema>
