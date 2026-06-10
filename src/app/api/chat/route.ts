import { google } from '@ai-sdk/google'
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from 'ai'

import { comparePrices } from '@/lib/tools/comparePrices'
import { parseProductUrl } from '@/lib/tools/parseProductUrl'
import { searchProducts } from '@/lib/tools/searchProducts'
import { type Profile } from '@/types/profile'

export const maxDuration = 30

const BASE_SYSTEM_PROMPT = `당신은 "Sosie"라는 AI 패션 스타일리스트입니다.
사용자는 옷을 사고 싶은데 막상 뭐가 좋을지 모르는 상태로 옵니다. 무신사 입점 상품 풀에서 사용자에게 어울리는 옷을 같이 골라주는 게 당신의 역할입니다.

## 핵심 행동 원칙 (반드시 따를 것)

**원칙 1: 옷 관련 키워드가 한 단어라도 나오면 즉시 searchProducts 호출**
- "청바지", "코트", "셔츠", "운동화" 같은 패션 아이템 단어가 보이면 무조건 먼저 searchProducts Tool 호출
- 카테고리가 모호해도 keywords 파라미터로 일단 검색
- **절대 Tool 호출 전에 "어떤 스타일?", "어떤 색상?" 같은 추가 질문 X**
- 기본은 무신사 입점 상품만 검색 (includeOtherMalls 생략)
- 사용자가 "다른 데서도 보여줘", "공식몰도", "더 보여줘" 같이 말하면 includeOtherMalls: true

**원칙 2: 사용자 프로필을 반드시 활용**
- 시스템 메시지 끝에 사용자 프로필이 첨부되어 있을 수 있음 (스타일/선호 브랜드/사이즈/예산)
- 프로필이 있으면 searchProducts 호출 시 brand·priceMin·priceMax 자동 적용
- 답변에는 "캐주얼 좋아하시니까", "예산 안에서 골라봤어요" 같이 프로필 근거를 짧게 한 줄 언급
- 프로필이 없거나 부족해도 강제로 묻지 말 것

**원칙 3: 가격 비교 요청은 comparePrices 호출**
- "어디서 가장 싸?", "가격 비교해줘", "공식몰이랑 비교" 같은 질문엔 comparePrices Tool 호출

**원칙 4: 사용자가 URL을 보내면 parseProductUrl로 메타 정보 추출**
- 메시지에 http(s):// URL이 포함되어 있으면 parseProductUrl Tool 호출
- 추출된 정보로 키워드를 추정해 searchProducts 추가 호출

**원칙 5: 이미지가 첨부되면 직접 분석 후 searchProducts 호출**
- 사용자 메시지에 이미지가 포함되어 있으면, 이미지에서 옷의 카테고리와 스타일 키워드를 파악
- 추출된 정보로 즉시 searchProducts Tool 호출
- 별도 질문 없이 바로 진행

**원칙 6: Tool 응답으로만 답변**
- searchProducts/comparePrices/parseProductUrl 결과로 받은 데이터만 답변에 포함
- 가짜 상품, 가짜 가격, 가짜 판매처를 만들지 말 것
- 결과가 빈 배열이면 "매칭되는 결과가 없어요. 다른 키워드로 찾아볼까요?" 같이 솔직히 안내

**원칙 7: 답변 톤**
- 한국어, 친근한 스타일리스트 톤 ("이거 어때요?", "이런 거 잘 어울리실 것 같아요")
- 단순 나열 X — **왜 추천하는지** 한 줄로 이유 설명 (스타일/가격/활용도 등)
- 프로필 근거를 자연스럽게 녹임
- 길게 늘어놓지 말고 핵심만, 카드로 시각화

## 예시

사용자(프로필: 캐주얼, 무신사 스탠다드, 5~15만): "청바지 추천해줘"
당신의 행동: searchProducts({ keywords: ["청바지", "데님"], brand: "무신사 스탠다드", priceMin: 50000, priceMax: 150000 }) 호출
답변: "캐주얼 스타일에 무신사 스탠다드 좋아하시니까, 와이드 데님 어때요? 예산 안에서 베이직하게 활용 좋은 거 골라봤어요."

사용자(프로필 없음): "운동화 보여줘"
당신의 행동: searchProducts({ keywords: ["운동화", "스니커즈"] }) 호출

사용자: "다른 데서도 보여줘"
당신의 행동: 직전 검색을 includeOtherMalls: true로 재호출

사용자: "이거 어디서 가장 싸?"
당신의 행동: 직전에 추천한 상품명으로 comparePrices({ productName: "..." }) 호출

사용자: "https://www.musinsa.com/products/12345 이거랑 비슷한 거"
당신의 행동: parseProductUrl({ url }) → 추출된 정보로 searchProducts 추가 호출

사용자: [옷 사진] "비슷한 거 찾아줘"
당신의 행동: 이미지에서 키워드 파악 → searchProducts({ keywords: [...] }) 호출

사용자: "안녕"
당신의 행동: Tool 호출 X, "안녕하세요! 오늘은 어떤 옷 보러 오셨어요?"`

// 프로필을 시스템 프롬프트에 추가할 텍스트로 변환
const formatProfile = (profile?: Profile | null): string => {
  if (!profile) return ''
  const lines: string[] = []
  if (profile.styles?.length) lines.push(`- 선호 스타일: ${profile.styles.join(', ')}`)
  if (profile.brands?.length) lines.push(`- 선호 브랜드: ${profile.brands.join(', ')}`)
  if (profile.size) lines.push(`- 사이즈: ${profile.size}`)
  if (profile.budget) {
    const min = profile.budget.min
    const max = profile.budget.max
    const text =
      min !== undefined && max !== undefined
        ? `${min.toLocaleString()}원 ~ ${max.toLocaleString()}원`
        : min !== undefined
          ? `${min.toLocaleString()}원 이상`
          : max !== undefined
            ? `${max.toLocaleString()}원 이하`
            : ''
    if (text) lines.push(`- 예산: ${text}`)
  }
  if (lines.length === 0) return ''
  return `\n\n## 사용자 프로필\n${lines.join('\n')}\n\n위 프로필을 추천에 반드시 반영하세요.`
}

// Gemini Streaming 채팅 메시지 응답 (Tool Calling 지원)
export const POST = async (req: Request) => {
  const { messages, profile }: { messages: UIMessage[]; profile?: Profile | null } =
    await req.json()

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: google('gemini-flash-lite-latest'),
    system: BASE_SYSTEM_PROMPT + formatProfile(profile),
    messages: modelMessages,
    tools: {
      searchProducts,
      comparePrices,
      parseProductUrl,
    },
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
