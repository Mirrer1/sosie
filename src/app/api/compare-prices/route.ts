import { runComparePrices } from '@/lib/tools/comparePrices'

// 카드 클릭 모달이 호출하는 가격 비교 엔드포인트
export const POST = async (req: Request) => {
  const { productName }: { productName?: string } = await req.json()

  if (!productName?.trim()) {
    return Response.json({ error: '상품명이 필요합니다.' }, { status: 400 })
  }

  try {
    const result = await runComparePrices(productName)
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : '가격 비교 실패'
    return Response.json({ error: message }, { status: 500 })
  }
}
