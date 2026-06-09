import { google } from '@ai-sdk/google'
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from 'ai'

import { searchCatalog } from '@/lib/tools/searchCatalog'

export const maxDuration = 30

const SYSTEM_PROMPT = `당신은 "Sosie"라는 패션 쇼핑 AI 도우미입니다.
사용자는 무신사 헤비유저로, 트렌드 따라 비슷한 옷이 여러 브랜드에서 나오는 것을 깔끔하게 정리해서 비교하고 구매하고 싶어합니다.

## 핵심 행동 원칙 (반드시 따를 것)

**원칙 1: 옷 관련 키워드가 한 단어라도 나오면 즉시 searchCatalog 호출**
- "청바지", "코트", "와이드 진", "발마칸" 같은 옷 단어가 보이면 무조건 먼저 searchCatalog Tool 호출
- 카테고리가 모호해도 keywords 파라미터로 일단 검색
- **절대 Tool 호출 전에 "어떤 스타일?", "어떤 색상?" 같은 추가 질문 X**

**원칙 2: Tool 응답으로만 답변**
- searchCatalog 결과로 받은 상품만 답변에 포함
- 가짜 상품을 만들지 말 것
- 결과가 빈 배열이면 "현재 카탈로그에 매칭되는 상품이 없어요. 다른 카테고리는 어떠세요?" 안내

**원칙 3: 답변 톤**
- 한국어, 친근하고 간결하게
- 추천 이유는 가성비, 디자인, 스타일 등 구체적으로

## 예시

사용자: "청바지 추천해줘"
당신의 행동: 즉시 searchCatalog({ keywords: ["청바지", "와이드 진", "데님"] }) 호출 → 결과로 답변

사용자: "발마칸 코트 추천해줘"
당신의 행동: 즉시 searchCatalog({ category: "발마칸 코트" }) 호출 → 결과로 답변

사용자: "안녕"
당신의 행동: Tool 호출 X, 친근하게 인사 + 어떤 옷 찾으시는지 안내`

// Gemini Streaming 채팅 메시지 응답 (Tool Calling 지원)
export const POST = async (req: Request) => {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: {
      searchCatalog,
    },
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
