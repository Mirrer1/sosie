import { z } from 'zod'

import { marketProductSchema } from './product'

// searchProducts Tool 입력
export const searchProductsInputSchema = z.object({
  keywords: z
    .array(z.string())
    .min(1)
    .describe('검색 키워드 (예: ["청바지", "와이드"]). 카테고리나 스타일 단어 1개 이상 필수.'),
  brand: z.string().optional().describe('브랜드 (예: "무신사 스탠다드"). 사용자가 선호하면 지정.'),
  priceMin: z.number().int().nonnegative().optional(),
  priceMax: z.number().int().nonnegative().optional(),
  includeOtherMalls: z
    .boolean()
    .optional()
    .describe(
      '기본 false (무신사 입점 상품만). true면 다른 몰(29CM, 공식몰 등)도 포함. 사용자가 명시적으로 더 보고 싶다고 했을 때만 true.',
    ),
})

// searchProducts Tool 출력
export const searchProductsOutputSchema = z.object({
  products: z.array(marketProductSchema),
})

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>
export type SearchProductsOutput = z.infer<typeof searchProductsOutputSchema>

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
