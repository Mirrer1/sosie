import { resolveProductUrl } from '@/lib/catalog/resolveProductUrl'

// 상품 id로 판매처 상품 페이지를 찾아 이동
export const GET = async (req: Request, ctx: RouteContext<'/go/[id]'>) => {
  const { id } = await ctx.params
  const target = await resolveProductUrl(decodeURIComponent(id)).catch(() => null)
  return Response.redirect(target ?? new URL('/', req.url), 302)
}
