import { tool } from 'ai'
import { z } from 'zod'

import catalogData from '@/data/catalog.json'
import { type CatalogProduct, catalogProductSchema } from '@/types/product'
import {
  type SearchCatalogInput,
  type SearchCatalogOutput,
  searchCatalogInputSchema,
} from '@/types/tool'

const catalog: CatalogProduct[] = z.array(catalogProductSchema).parse(catalogData)

// 카탈로그에서 카테고리/키워드/가격대로 매칭 상품 필터
export const filterCatalog = (input: SearchCatalogInput): SearchCatalogOutput => {
  const { category, keywords, priceMin, priceMax } = input

  const products = catalog.filter((p) => {
    if (category && !p.category.includes(category) && !category.includes(p.category)) {
      return false
    }
    if (priceMin !== undefined && p.price < priceMin) return false
    if (priceMax !== undefined && p.price > priceMax) return false

    if (keywords && keywords.length > 0) {
      const haystack = [...p.tags, p.name, p.description, p.category].join(' ')
      const hasMatch = keywords.some((kw) => haystack.includes(kw))
      if (!hasMatch) return false
    }

    return true
  })

  return { products }
}

export const searchCatalog = tool({
  description:
    '무신사 트렌드 카탈로그에서 카테고리, 키워드, 가격대로 상품을 검색합니다. 사용자가 옷 스타일이나 카테고리를 언급할 때 호출하세요.',
  inputSchema: searchCatalogInputSchema,
  execute: async (input) => filterCatalog(input),
})
