# LLM Agent 설계 + 데이터 소스

> Sosie의 AI Agent 구조, Tool 명세, 데이터 소스, 흐름, 시스템 프롬프트.

---

## 모델 / SDK

- **모델**: Gemini 2.0 Flash (Google AI Studio, 무료 티어)
- **SDK**: Vercel AI SDK (`ai`, `@ai-sdk/google`)
- 선정 이유: [`DECISIONS.md`](DECISIONS.md) 참조
- Streaming + Tool Calling + provider 추상화

---

## 데이터 소스 3종 (요약)

| 소스 | 역할 | 위치 |
| --- | --- | --- |
| **큐레이션 카탈로그** | 트렌드 상품 베이스 (메인) | `src/data/catalog.json` |
| **네이버 쇼핑 API** | 판매처별 가격 비교 fallback | 외부 API |
| **OG 파싱** | URL 입력 시 메타 추출 | `open-graph-scraper` |

---

## Tool 4개 명세

모든 Tool 입출력은 **Zod 스키마로 강제**. LLM 환각/형식 오류 차단.

---

### 1. `searchCatalog`

**역할**: 큐레이션된 무신사 트렌드 카탈로그에서 비슷한 상품 찾기.

**입력 스키마**:
```ts
{
  category?: string      // "발마칸 코트", "와이드 진" 등
  keywords?: string[]    // ["오버핏", "캐멀", "캐주얼"]
  priceMin?: number
  priceMax?: number
}
```

**출력 스키마**:
```ts
{
  products: Array<{
    id: string
    category: string
    brand: string
    name: string
    price: number
    imageUrl: string
    productUrl: string
    tags: string[]
    description: string
  }>
}
```

#### 데이터 소스: 큐레이션 카탈로그

**파일**: `src/data/catalog.json`

**JSON 스키마 (1건)**:
```json
{
  "id": "uniformbridge-balmacaan-camel",
  "category": "발마칸 코트",
  "brand": "유니폼브릿지",
  "name": "발마칸 싱글 코트",
  "price": 168000,
  "imageUrl": "https://image.msscdn.net/images/goods_img/.../detail.jpg",
  "productUrl": "https://www.musinsa.com/products/1234567",
  "tags": ["오버핏", "캐멀", "캐주얼"],
  "description": "캐멀톤 오버핏 발마칸 코트. 미니멀, 데일리 활용도 높음."
}
```

**큐레이션 정책**:

- **카테고리 6개** (작업 시점 본인이 보는 무신사 트렌드 기준)
  - 발마칸 코트, 워크자켓, 와이드 진, 카고팬츠, 니트 풀오버, 셋업/오버사이즈 셔츠
- **카테고리당 4~5개 브랜드/상품**
- **가격대 다양** — 저가(8~12만) / 중가(15~25만) / 고가(30만~)
- **브랜드 분산** — 유니폼브릿지/코스/와이드앵글/유스/노운 등
- **이미지/URL은 진짜 무신사 거** — 카드 클릭 시 실제 무신사 상품 페이지로 이동

**큐레이션 기준**:
- 평소 본인이 "이거 사고 싶다" 생각해본 상품
- 무신사 페이지 살아있는 (404 X) 상품
- 이미지 URL이 직접 CDN인 거

**런타임 처리**: 빌드 타임에 import → 메모리 검색. I/O 없음.

---

### 2. `analyzeImage`

**역할**: 사용자가 업로드한 옷 이미지에서 스타일 키워드 추출.

**입력 스키마**:
```ts
{
  imageBase64: string    // 사용자 업로드 이미지
  userHint?: string      // 사용자가 같이 입력한 텍스트 (있다면)
}
```

**출력 스키마**:
```ts
{
  category: string                     // "발마칸 코트"
  styleKeywords: string[]              // ["오버핏", "캐멀", "더블브레스트"]
  estimatedPriceRange?: [number, number]
  description: string                  // "캐멀톤의 오버핏 발마칸 코트로..."
}
```

#### 데이터 소스: Gemini 멀티모달

- Gemini 2.0 Flash 직접 호출 (별도 내부 함수, Tool 내부에서 LLM 한 번 더 부름)
- 이미지 base64 → 시스템 프롬프트 + 사용자 hint와 함께 전달
- 응답을 Zod로 검증

---

### 3. `comparePrices`

**역할**: 같은/유사한 상품의 다양한 판매처 가격 비교.

**입력 스키마**:
```ts
{
  productName: string    // "유니폼브릿지 발마칸 싱글 코트"
  brand?: string
}
```

**출력 스키마**:
```ts
{
  sources: Array<{
    seller: string       // "무신사", "유니폼브릿지 공식몰", "29CM"
    price: number
    url: string
    benefit?: string     // "무료배송", "5% 적립"
    imageUrl?: string
  }>
}
```

#### 데이터 소스: 네이버 쇼핑 검색 API

**등록**: https://developers.naver.com → 애플리케이션 등록 → "쇼핑 검색" 활성화
**한도**: 무료 일 25,000회

**엔드포인트**:
```
GET https://openapi.naver.com/v1/search/shop.json
  ?query=유니폼브릿지+발마칸
  &display=10
  &sort=sim

Headers:
  X-Naver-Client-Id: ${NAVER_CLIENT_ID}
  X-Naver-Client-Secret: ${NAVER_CLIENT_SECRET}
```

**응답 매핑**:
```ts
naverItem.title (HTML tag 제거) → 상품명
naverItem.lprice → price
naverItem.link → url
naverItem.image → imageUrl
naverItem.mallName → seller
```

**캐싱**: 메모리 캐시 가능 (선택 — Vercel 서버리스라 짧음).

---

### 4. `parseProductUrl`

**역할**: 사용자가 던진 상품 URL에서 메타 정보 추출.

**입력 스키마**:
```ts
{
  url: string    // 무신사/29CM/공식몰 URL
}
```

**출력 스키마**:
```ts
{
  title: string
  imageUrl?: string
  description?: string
  price?: number
  brand?: string
  sourceUrl: string
}
```

#### 데이터 소스: open-graph-scraper

**라이브러리**: `open-graph-scraper` (npm)

**사용 예시**:
```ts
import ogs from 'open-graph-scraper'

const { result } = await ogs({ url: 'https://www.musinsa.com/products/...' })
// result.ogTitle, result.ogImage, result.ogDescription
```

**주의**:
- 사이트별 OG 태그 품질 들쭉날쭉 (무신사도 페이지마다 다름)
- 실패 시 graceful fallback (빈 필드 OK, Tool 응답 자체는 성공으로)

---

## Agent 흐름

### 시나리오 A — 텍스트 시드

```
사용자: "발마칸 코트 추천해줘"
  ↓
[1] Agent: searchCatalog({ category: "발마칸 코트" })
    → 카탈로그에서 4~5개 발마칸 코트 반환
  ↓
[2] Agent: comparePrices({ productName: "유니폼브릿지 발마칸 싱글 코트" })
    → 무신사 12만 / 공식몰 15만 / 29CM 13만
  ↓
[3] Agent 응답 (Streaming):
    "요즘 발마칸은 오버핏이 핫해요. 유니폼브릿지가 디자인 단순하면서 가성비 좋습니다.
    무신사에서 12만원으로 가장 저렴해요. 코스랑 와이드앵글도 비교해보세요."
    + 상품 카드 그리드 (4개)
```

### 시나리오 B — 이미지 시드

```
사용자: [옷 사진 업로드] "이거랑 비슷한 거"
  ↓
[1] Agent: analyzeImage({ imageBase64, userHint: "이거랑 비슷한 거" })
    → { category: "발마칸 코트", styleKeywords: ["오버핏", "캐멀"], ... }
  ↓
[2] Agent: searchCatalog({ category: "발마칸 코트", keywords: ["오버핏", "캐멀"] })
    → 매칭 상품
  ↓
[3] Agent: (선택) comparePrices(...)
  ↓
[4] Agent 응답 (Streaming):
    "올려주신 사진은 캐멀톤 오버핏 발마칸이네요. 비슷한 디자인 4개 찾았어요."
    + 상품 카드 그리드
```

### 시나리오 C — URL 시드

```
사용자: "이거랑 비슷한 거 [무신사 URL]"
  ↓
[1] Agent: parseProductUrl({ url })
    → 제목/이미지/가격 메타
  ↓
[2] Agent: searchCatalog({ category, keywords })
    → 비슷한 상품
  ↓
[3] Agent 응답
```

---

## Tool ↔ 데이터 소스 매핑 (요약)

| Tool | 데이터 소스 |
| --- | --- |
| `searchCatalog` | `src/data/catalog.json` (in-memory) |
| `analyzeImage` | Gemini 멀티모달 (외부 LLM 호출) |
| `comparePrices` | 네이버 쇼핑 검색 API |
| `parseProductUrl` | `open-graph-scraper` |

---

## 시스템 프롬프트 (초안)

> 작업 중 튜닝하며 채워나갈 자리.

```
당신은 "Sosie"라는 패션 쇼핑 AI 도우미입니다.
사용자는 무신사 헤비유저로, 트렌드 따라 비슷한 옷이 여러 브랜드에서 나오는 것을
깔끔하게 정리해서 비교/구매하고 싶어합니다.

## 핵심 행동 원칙

1. **단순 검색 X, 다단계 사고 O**
   - 사용자 시드(텍스트/이미지/URL) → 핵심 의도 파악
   - 적절한 Tool을 순서대로 호출
   - 결과를 종합해 "이거 사세요" 명확히 추천

2. **Tool 사용 가이드**
   - 텍스트 시드: searchCatalog 우선 → 필요시 comparePrices 보완
   - 이미지 시드: analyzeImage 먼저 → 추출된 키워드로 searchCatalog
   - URL 시드: parseProductUrl 먼저 → 추출된 정보로 searchCatalog
   - 가격 비교 요청 명시되면: 반드시 comparePrices 호출

3. **응답 톤**
   - 친근, 간결, 패션 매거진 느낌
   - 줄글로 길게 X — 핵심 추천 1~3줄 + 카드로 시각화
   - 추천 이유는 구체적으로 (가성비/디자인/스타일)

4. **금지 사항**
   - 카탈로그에 없는 상품 임의 생성 ❌ (Tool로만 답변)
   - 가격/링크 임의 생성 ❌ (Tool 응답만 사용)
   - 영문 답변 ❌ (한국어 고정)
```

---

## 응답 검증 전략

**환각 차단 3중 방어:**

1. **Tool 입출력 Zod 스키마 강제** — Vercel AI SDK의 `tool` API + `parameters: z.object(...)`
2. **응답 후처리** — Tool 응답을 카드 UI로 렌더링할 때 다시 Zod 파싱
3. **시스템 프롬프트 금지 조항** — "카탈로그/Tool 응답 외 정보 답변 금지"

**실패 케이스 처리:**
- Tool 응답 빈 배열 → "찾은 결과 없습니다, 다른 키워드로 다시 찾아드릴까요?"
- 네이버 API 실패 → 카탈로그 결과만으로 답변
- 이미지 분석 실패 → "이미지에서 옷을 인식하지 못했어요" 후 텍스트로 다시 요청

---

## Agent 사고 과정 가시화

Vercel AI SDK는 Tool 호출을 streaming 이벤트로 노출 (`onToolCall`, `onToolResult`).
이를 UI에 그대로 흘려서 사용자에게 보여줍니다.

| Tool 호출 | 사용자 화면 표시 |
| --- | --- |
| `searchCatalog` 시작 | `🔧 카탈로그에서 검색 중...` |
| `searchCatalog` 완료 | `✓ 4개 상품 찾음` |
| `comparePrices` 시작 | `🔧 판매처별 가격 비교 중...` |
| `analyzeImage` 시작 | `🔧 이미지 분석 중...` |
| `parseProductUrl` 시작 | `🔧 URL 정보 추출 중...` |

→ 평가 핵심 2번(에이전트 흐름) 직접 어필.

---

## V2 — 카탈로그 확장 (참고)

- **무신사 파트너 API** 신청 / 제휴
- **자체 크롤링 파이프라인** — 약관 확인 + robots.txt 존중
- **자동 업데이트 cron** — 매일 인기 차트 → 카탈로그 갱신
- **벡터 임베딩 검색** — Pinecone/Supabase pgvector로 시맨틱 검색

(MVP에는 포함 X. README "향후 개선"에만 언급.)

---

## TODO (작업 중 채울 것)

- [ ] 시스템 프롬프트 실전 튜닝 (모델 응답 보며 수정)
- [ ] Tool별 입출력 실제 예시 JSON 기록
- [ ] 실패 케이스별 fallback 메시지 다듬기
- [ ] 사고 과정 UI 디자인 명세 (아이콘/색/애니메이션)
- [ ] 카탈로그 실제 큐레이션 (30~40개 작성)
