import { google } from '@ai-sdk/google'
import { Output, generateText } from 'ai'
import { z } from 'zod'

import { PRODUCT_CATEGORIES, PRODUCT_GENDERS } from '@/types/catalog'
import { STYLE_OPTIONS } from '@/types/profile'

const TAG_MODEL = 'gemini-flash-lite-latest'

const tagSchema = z.object({
  items: z.array(
    z.object({
      index: z.number().int(),
      isFashion: z.boolean(),
      brand: z.string(),
      name: z.string(),
      category: z.enum(PRODUCT_CATEGORIES),
      subcategory: z.string(),
      gender: z.enum(PRODUCT_GENDERS),
      colors: z.array(z.string()),
      materials: z.array(z.string()),
      styles: z.array(z.string()),
      keywords: z.array(z.string()),
    }),
  ),
})

export type ProductTag = Omit<z.infer<typeof tagSchema>['items'][number], 'index'>

export type TagInput = {
  title: string
  mall: string
  price: number
}

const TAG_PROMPT = `너는 한국 패션 쇼핑 데이터 정리 담당이다. 아래 구글 쇼핑 상품 목록을 항목마다 태깅해라.

규칙
- index: 입력 번호 그대로
- isFashion: 의류, 신발, 가방, 모자, 패션 액세서리면 true. 화장품, 생활용품, 중고, 렌탈, 도매, 부속품이면 false
- brand: 한국 쇼핑몰에서 흔히 쓰는 한글 브랜드명 (예: "커버낫", "나이키", "무신사 스탠다드"). 알 수 없으면 상품명 앞 단어
- name: 상품명에서 브랜드 표기와 판매처 표기를 뺀 깔끔한 상품명. 모델코드와 색상은 유지
- category: ${PRODUCT_CATEGORIES.join(', ')} 중 하나
- subcategory: 한 단어 한글 세부 품목 (예: 반팔티, 맨투맨, 데님팬츠, 스니커즈, 크로스백)
- gender: ${PRODUCT_GENDERS.join(', ')} 중 하나
- colors, materials: 상품명에 드러난 한글 색상과 소재만
- styles: ${STYLE_OPTIONS.join(', ')} 중 어울리는 것 0~3개
- keywords: 사용자가 이 상품을 찾을 때 쓸 만한 한글 검색어 3~6개 (같은 뜻 표기, 계절, 핏 포함)`

// 상품 목록을 Gemini로 한 번에 태깅
export const tagProducts = async (inputs: TagInput[]): Promise<Map<number, ProductTag>> => {
  const list = inputs
    .map((item, index) => `${index}\t${item.title}\t${item.mall}\t${item.price}원`)
    .join('\n')

  const { output } = await generateText({
    model: google(TAG_MODEL),
    output: Output.object({ schema: tagSchema }),
    temperature: 0,
    prompt: `${TAG_PROMPT}\n\n번호\t상품명\t판매처\t가격\n${list}`,
  })

  const result = new Map<number, ProductTag>()
  for (const { index, ...tag } of output.items) {
    if (index < 0 || index >= inputs.length) continue
    result.set(index, {
      ...tag,
      styles: tag.styles.filter((style) => STYLE_OPTIONS.includes(style)),
    })
  }
  return result
}
