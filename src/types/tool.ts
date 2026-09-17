import { z } from 'zod'

import { marketProductSchema } from './product'

// searchProducts Tool 입력
export const searchProductsInputSchema = z.object({
  keywords: z
    .array(z.string())
    .min(1)
    .describe(
      '검색 키워드 2~4개, 최소 1개 필수. 같은 뜻의 다른 표기를 함께 넣어 매칭률을 높이세요 (청바지 → ["청바지", "데님"], 맨투맨 → ["맨투맨", "스웨트셔츠"], 운동화 → ["운동화", "스니커즈"], 후드 → ["후드", "후디"]). 사용자가 말한 핏·색상·소재도 키워드로 추가.',
    ),
  styles: z
    .array(z.string())
    .optional()
    .describe(
      '이번 요청에서 사용자가 말한 스타일 (예: ["스트릿"]). 생략하면 프로필 스타일이 자동 적용됩니다. 결과 정렬에만 쓰이고 검색을 좁히지 않습니다.',
    ),
  brand: z
    .string()
    .optional()
    .describe(
      '이번 요청에서 사용자가 직접 말한 브랜드만 (예: "나이키 운동화" → "나이키"). 프로필 선호 브랜드는 넣지 마세요. 서버가 가산점으로 자동 반영합니다.',
    ),
  priceMin: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('최소 가격(원). 이번 요청에서 말한 예산이 있으면 지정. 생략하면 프로필 예산 적용.'),
  priceMax: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('최대 가격(원). 이번 요청에서 말한 예산이 있으면 지정. 생략하면 프로필 예산 적용.'),
  includeOtherMalls: z
    .boolean()
    .optional()
    .describe(
      '기본 false (무신사 상품만). true면 29CM, KREAM, 브랜드 공식몰 같은 다른 판매처도 포함. 사용자가 다른 곳 상품도 보고 싶다고 했을 때만 true.',
    ),
})

// searchProducts Tool 출력
export const searchProductsOutputSchema = z.object({
  products: z.array(marketProductSchema),
  outOfBudget: z.boolean().optional(), // 예산 밖 상품 포함 여부
  repeatedCount: z.number().int().optional(), // 같은 대화에서 이전에 보여준 상품 수
  notice: z.string().optional(), // AI 답변에 반드시 반영할 안내
})

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>
export type SearchProductsOutput = z.infer<typeof searchProductsOutputSchema>

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

// updateProfile Tool 입력
export const updateProfileInputSchema = z.object({
  styles: z.array(z.string()).optional().describe('스타일 태그 (예: ["캐주얼", "미니멀"]).'),
  brands: z.array(z.string()).optional().describe('선호 브랜드 (예: ["무신사 스탠다드"]).'),
  gender: z
    .enum(['남성', '여성', '전체'])
    .optional()
    .describe(
      '추천받을 상품 성별. "남자 옷 위주로" → "남성", "여자 옷" → "여성", "남녀 다 보여줘" → "전체"(성별 설정 해제).',
    ),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  budget: z
    .object({
      min: z.number().int().nonnegative().optional(),
      max: z.number().int().nonnegative().optional(),
    })
    .optional()
    .describe('예산 범위 (단위 원).'),
  mode: z
    .enum(['merge', 'replace'])
    .default('merge')
    .describe(
      'merge: 기존 값에 추가/덮어쓰기 (배열은 합집합). replace: 보낸 필드를 통째로 교체 (배열 비우기 가능).',
    ),
  reason: z
    .string()
    .describe(
      '업데이트 근거 한 문장 (예: "사용자가 빈티지 스타일도 좋아한다고 말함"). 답변 톤에 활용.',
    ),
})

// updateProfile Tool 출력
export const updateProfileOutputSchema = z.object({
  updated: z.object({
    styles: z.array(z.string()).optional(),
    brands: z.array(z.string()).optional(),
    gender: z.enum(['남성', '여성', '전체']).optional(), // 전체는 성별 설정 해제
    size: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
    budget: z
      .object({
        min: z.number().int().nonnegative().optional(),
        max: z.number().int().nonnegative().optional(),
      })
      .optional(),
  }),
  mode: z.enum(['merge', 'replace']),
  reason: z.string(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>
export type UpdateProfileOutput = z.infer<typeof updateProfileOutputSchema>
