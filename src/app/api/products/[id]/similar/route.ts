import { findSimilarProducts } from '@/lib/catalog/similarProducts'

// 상품 미리보기의 비슷한 상품 목록
export const GET = async (_req: Request, ctx: RouteContext<'/api/products/[id]/similar'>) => {
  const { id } = await ctx.params
  try {
    const products = await findSimilarProducts(decodeURIComponent(id))
    return Response.json({ products })
  } catch (e) {
    const message = e instanceof Error ? e.message : '비슷한 상품 조회 실패'
    return Response.json({ error: message }, { status: 500 })
  }
}
