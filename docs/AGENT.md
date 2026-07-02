# LLM Agent 설계 + 데이터 소스

> Sosie의 AI Agent 구조, Tool 명세, 데이터 소스, 흐름, 시스템 프롬프트.

---

## 모델 / SDK

- **모델**: **Gemini Flash Lite** (`gemini-flash-lite-latest`, Google AI Studio free tier 1500/day)
- **SDK**: Vercel AI SDK v6 (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- 멀티모달 native 지원 (이미지 입력은 별도 Tool 없이 사용자 메시지 file part로 처리)
- Tool Calling 다단계 (`stopWhen: stepCountIs(5)`)
- 선정 이유 및 변경 이력: [`DECISIONS.md`](DECISIONS.md) ADR-002 참조

---

## 컨셉

> **"옷 사고 싶은데 뭐 살지 모를 때, 같이 골라주는 AI 패션 스타일리스트"**

- 사용자 프로필(스타일/브랜드/사이즈/예산)을 미리 받아둠
- 매 요청에 프로필을 시스템 프롬프트에 동적 주입 → AI가 추천에 반영
- 대화 중 사용자가 흘리는 취향("사실 빈티지도 좋아해")을 감지해 프로필에 누적
- 검색 풀은 무신사 입점 상품 (네이버 쇼핑 API + 무신사 필터)

---

## 데이터 소스 3종 (요약)

| 소스 | 역할 | 위치 |
| --- | --- | --- |
| **네이버 쇼핑 검색 API** | 무신사 입점 상품 검색 + 판매처 가격 비교 | 외부 API |
| **OG 파싱** | URL 입력 시 메타 추출 | `open-graph-scraper` |
| **localStorage 프로필** | 사용자 프로필 영속화 | `sosie:profile` (브라우저) |

---

## Tool 4개 명세

모든 Tool 입출력은 **Zod 스키마로 강제**. LLM 환각/형식 오류 차단.
이미지 분석은 별도 Tool 없이 Gemini 멀티모달 native로 처리 (메시지의 file part).

스키마 정의: [`src/types/tool.ts`](../src/types/tool.ts), [`src/types/profile.ts`](../src/types/profile.ts)

---

### 1. `searchProducts`

**역할**: 무신사 입점 상품을 키워드·브랜드·가격대로 검색.

**입력 스키마**:
```ts
{
  keywords: string[]              // ["청바지", "와이드"] — 최소 1개
  styles?: string[]               // 프로필 선호 스타일 (정렬에만 사용)
  brand?: string                  // "무신사 스탠다드"
  priceMin?: number               // 원 단위
  priceMax?: number
  includeOtherMalls?: boolean     // 기본 false (무신사만). true면 다른 몰 포함
}

자주 찜한 브랜드(`favoriteBrands`)는 스키마가 아니라 요청별 주입으로 전달됨 — `createSearchProducts(favoriteBrands)`가 검색어 추가 + 점수 가산에 사용.
```

**출력 스키마**:
```ts
{
  products: Array<{
    id: string
    brand: string
    name: string
    price: number
    imageUrl: string
    productUrl: string
    mall: string
  }>
}
```

#### 데이터 소스: 네이버 쇼핑 검색 API

**등록**: https://developers.naver.com → 애플리케이션 등록 → "쇼핑 검색" 활성화
**한도**: 무료 일 25,000회

**호출**:
```
GET https://openapi.naver.com/v1/search/shop.json
  ?query={query}
  &display=100
  &sort=sim

Headers:
  X-Naver-Client-Id: ${NAVER_CLIENT_ID}
  X-Naver-Client-Secret: ${NAVER_CLIENT_SECRET}
```

**결과 가공 파이프라인 (구현)** — 상세 [`DECISIONS.md`](DECISIONS.md) ADR-014:
- `buildQuery` — `includeOtherMalls=false`면 "무신사" 키워드 강제 첨부 + 브랜드 + 스타일 특징 단어 + keywords 조립
- `buildQueryVariants` — 스타일 특징 단어 쿼리 + 기본 쿼리 + 0건 완화(브랜드/보조 키워드 단계적 제거) 쿼리 목록. 찜 브랜드별 쿼리도 추가됨
- 모든 변경 쿼리를 `Promise.allSettled`로 **동시 호출**, 일부 실패 무시·전부 실패만 에러 → 응답을 합쳐서 가공
- `isMusinsa` — `link`가 `musinsa.com` 도메인이거나 `mallName`이 "무신사" 포함
- `mapNaverItem` — 상품명 앞 `[브랜드]`에서 브랜드 추출(없으면 mallName 폴백), 표시 이름에선 대괄호 제거
- `isRelevantItem` — 비패션 카테고리(`category1`) + 중고/도매 등 노이즈 제외
- `matchesKeywords` + `expandKeywords` — 키워드(동의어 포함: 청바지↔데님 등)가 상품명에 하나라도 맞는 것만, 전부 안 맞으면 카테고리 결과로 폴백
- `scoreProduct` + `dedupeByName` — 키워드·브랜드·스타일·찜 브랜드·예산 근접도로 재랭킹 + 중복 제거
- 상위 18개 풀에서 가중 랜덤으로 6개 반환하되 **스타일 맞는 것 우선 + 브랜드당 최대 2개**(쏠림 방지, 부족하면 한도 무시 채움)

응답의 `mallName`은 흔히 "네이버" 또는 셀러스토어 이름이 와서 신뢰가 떨어짐 → **링크 도메인 기준 필터**가 더 정확. 구현: [`src/lib/tools/searchProducts.ts`](../src/lib/tools/searchProducts.ts)

---

### 2. 이미지 입력 (별도 Tool 없음)

사용자가 옷 이미지를 첨부하면 메시지의 file part로 Gemini에 직접 전달됨.
Gemini가 이미지를 분석한 뒤 시스템 프롬프트 원칙 5에 따라 자동으로 `searchProducts` Tool을 호출.

**UI 흐름**:
- ChatComposer: 파일 picker / 드래그앤드롭 / 클립보드 paste 3가지 입력 모두 지원
- 검증: `image/jpeg`, `image/png`, `image/webp` + 5MB 이하 (`src/utils/image.ts`)
- 미리보기 + 확대 라이트박스
- ChatRoot에서 base64 data URL로 변환 후 `sendMessage({ text, files: [{ type: 'file', mediaType, filename, url }] })`

**왜 별도 Tool 안 만들었나**:
- Flash Lite 멀티모달이 이미지 이해 + Tool 결정을 한 번에 처리
- 별도 `analyzeImage` Tool을 만들면 LLM이 두 번 호출돼 비용/지연 증가
- 단일 step에서 이미지 → searchProducts 키워드 추출까지 진행

---

### 3. `comparePrices`

**역할**: 추천한 상품의 판매처별 가격 비교.

**입력 스키마**:
```ts
{
  productName: string    // "유니폼브릿지 발마칸 싱글 코트"
  brand?: string         // "유니폼브릿지" — 알면 전달, 다른 브랜드 결과 제외에 사용
}
```

**출력 스키마**:
```ts
{
  sources: Array<{
    seller: string
    price: number
    url: string
    imageUrl?: string
    title?: string
  }>
}
```

**데이터 소스**: 네이버 쇼핑 검색 API (필터 없이, mallName 기준 그루핑)

**호출 경로 (2개)**:
1. **LLM Tool 호출** — 사용자가 채팅으로 "가격 비교해줘" 류 요청 시 Agent가 자동 호출, 결과는 텍스트 답변
2. **카드 클릭 모달** — `ProductCard` 클릭 → `ComparePricesDialog` → `POST /api/compare-prices` → 동일 함수(`runComparePrices`) 실행 → 모달 안에 판매처 카드 리스트 (가격 오름차순, 최저가 뱃지, 각 판매처 직접 구매 링크)

**구현 분리**: 핵심 로직은 `runComparePrices(productName, brand?)` 함수로 추출, Tool과 라우트가 동일 함수를 공유. 응답 매핑(`mapNaverResponse`)에서 네이버 검색 결과 URL(`search.shopping.naver.com`)은 외부 진입 시 차단되므로 "{상품명} {판매처}" 쿼리의 네이버 쇼핑 검색 페이지로 우회. `smartstore`/외부 mall 직접 URL은 그대로 유지.

**정확도(ADR-012 업데이트)**: brand 인자로 다른 브랜드 제외 + "브랜드 뺀 구별 단어" 기준으로 같은 브랜드 다른 모델까지 걸러냄.

**카드 모달 UX(ADR-011 업데이트)**: 상단 대표 이미지(클릭 카드) + 판매처 행은 가격·최저가 대비 차액, 하단 "최저가 보러 가기" CTA. 로딩 스켈레톤·순차 등장·실패 시 재시도·같은 상품 재클릭 캐시(`id` 기준).

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
  siteName?: string
  sourceUrl: string
}
```

**데이터 소스**: `open-graph-scraper` (npm)

**주의**:
- 사이트별 OG 태그 품질 들쭉날쭉 (무신사도 페이지마다 다름)
- 실패 시 graceful fallback (빈 필드 OK, Tool 응답 자체는 성공으로)

---

### 5. `updateProfile` (Sosie 컨셉 핵심)

**역할**: 대화 중 사용자가 흘리는 취향을 감지해 프로필에 누적/교체.

**입력 스키마**:
```ts
{
  styles?: string[]
  brands?: string[]
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL'
  budget?: { min?: number; max?: number }   // BUDGET_RANGES 프리셋 중 하나로 매핑
  mode: 'merge' | 'replace'                 // 기본 'merge'
  reason: string                            // 한 문장 근거
}
```

**출력 스키마**:
```ts
{
  updated: { styles?, brands?, size?, budget? }   // 입력의 변경 필드만 echo
  mode: 'merge' | 'replace'
  reason: string
}
```

**동작**:
- 서버 `execute`는 입력을 그대로 echo (LLM이 무엇을 의도했는지 출력만 함)
- **실제 적용은 클라이언트** — `ChatRoot`가 메시지 스캔으로 `tool-updateProfile.output-available`을 감지 → toolCallId로 dedupe → **확인 카드(`ProfileUpdatePrompt`)로 사용자가 [반영] 선택 시** mode에 따라 머지/교체 → localStorage 저장 (ADR-009 업데이트: 즉시 반영 X)
- merge: 배열은 합집합, scalar(size/budget)은 새 값으로 덮어쓰기. budget은 단일 범위라 deep-merge 안 함
- replace: 보낸 필드를 통째 교체 (배열 비우기 가능)

**budget 프리셋 정책**:
- AI는 자유 금액("20만원까지")을 받으면 4개 프리셋 중 가장 가까운 것으로 매핑
- 프리셋: `{0~50000}`, `{50000~150000}`, `{150000~300000}`, `{300000~}`
- 시스템 프롬프트 원칙 8-1에 강제 규칙으로 명시
- 트레이드오프: UI 칩과 100% 매칭 vs 사용자 자유 표현 — 칩 동기화 우선

구현:
- Tool: [`src/lib/tools/updateProfile.ts`](../src/lib/tools/updateProfile.ts)
- 클라이언트 반영: [`src/components/ChatRoot.tsx`](../src/components/ChatRoot.tsx)의 `appliedProfileUpdates` useEffect

---

## Agent 흐름

### 시나리오 A — 프로필 보유, 텍스트 시드

```
프로필: 캐주얼·무신사 스탠다드·M·5~15만
사용자: "청바지 추천해줘"
  ↓
[1] Agent: searchProducts({
      keywords: ["청바지","데님"],
      brand: "무신사 스탠다드",
      priceMin: 50000, priceMax: 150000
    })
  ↓
[2] Agent 답변 (Streaming):
    "캐주얼 좋아하시고 무신사 스탠다드 자주 입으시니까, 와이드 데님 어때요?
    예산 안에서 베이직하게 활용 좋은 거 골라봤어요."
    + 상품 카드 그리드
```

### 시나리오 B — 대화 중 취향 학습

```
사용자: "사실 빈티지도 좋아해"
  ↓
[1] Agent: updateProfile({
      styles: ["빈티지"],
      mode: "merge",
      reason: "사용자가 빈티지 스타일 추가 언급"
    })
  ↓
[2] 클라이언트: 결과 받아 localStorage 머지 (styles에 "빈티지" 합집합)
  ↓
[3] Agent 답변: "프로필에 반영했어요. 빈티지 무드 셔츠도 찾아드릴까요?"
  ↓ (다음 검색부터 styles에 "빈티지" 포함됨)
```

### 시나리오 C — 예산 상향

```
사용자: "예산을 20만원까지로 늘려줘"
  ↓
[1] Agent: updateProfile({
      budget: { min: 150000, max: 300000 },   // 자유 금액 → 15~30만 프리셋
      mode: "merge",
      reason: "사용자가 상한 예산 상향 요청"
    })
  ↓
[2] 클라이언트: budget을 통째 교체 (deep-merge 안 함)
  ↓
[3] Agent 답변: "예산 범위 15~30만으로 반영했어요"
```

### 시나리오 D — 이미지 시드

```
사용자: [옷 사진 + "비슷한 거"]
  ↓
이미지가 file part로 Gemini에 직접 전달 (별도 Tool X)
  ↓
[1] Gemini 멀티모달 내부 처리:
    이미지 시각 분석 → 카테고리("발마칸 코트") + 스타일 키워드("오버핏","캐멀") 추출
  ↓
[2] Agent: searchProducts({ keywords: ["발마칸","오버핏","캐멀"] })
  ↓
[3] Agent 답변 + 상품 카드 그리드
```

### 시나리오 E — URL 시드

```
사용자: "이거랑 비슷한 거 [무신사 URL]"
  ↓
[1] Agent: parseProductUrl({ url })
  ↓
[2] Agent: searchProducts({ keywords: 추출된 키워드 })
  ↓
[3] Agent 답변
```

---

## Tool ↔ 데이터 소스 매핑 (요약)

| Tool | 데이터 소스 |
| --- | --- |
| `searchProducts` | 네이버 쇼핑 검색 API (무신사 입점 필터) |
| `comparePrices` | 네이버 쇼핑 검색 API (Tool 호출 + `/api/compare-prices` 라우트 양쪽에서 재사용) |
| `parseProductUrl` | `open-graph-scraper` |
| `updateProfile` | 클라이언트 localStorage (`sosie:profile`) |
| (이미지 입력) | Gemini Flash Lite 멀티모달 native (별도 Tool 없음) |

---

## 시스템 프롬프트 (현재 구현)

실제 코드: [`src/app/api/chat/route.ts`](../src/app/api/chat/route.ts)

원칙 8개 + 서브원칙 (Flash Lite의 보수적 Tool calling 성향 보완을 위해 강한 지시문 + few-shot 예시):

1. **옷 키워드 한 단어라도 나오면 즉시 `searchProducts`** — 추가 질문 X, 카테고리 모호해도 일단 검색
2. **사용자 프로필을 반드시 활용** — brand·priceMin·priceMax 자동 적용, 답변에 프로필 근거 한 줄 언급
3. **가격 비교 요청은 `comparePrices`**
4. **URL 포함 시 `parseProductUrl` → `searchProducts` 연쇄**
5. **이미지 첨부 시 Gemini가 직접 이미지 분석 → `searchProducts` 호출** — 별도 Tool X
6. **Tool 응답으로만 답변** — 가짜 상품/가격/판매처 만들지 X, 빈 결과면 솔직히
7. **답변 톤** — 친근한 스타일리스트, 추천 이유 한 줄, 단순 나열 X
8. **대화 중 프로필 단서 감지 → `updateProfile` 호출** — 변경 필드만 1회 호출, mode/reason 포함
   - **8-1**: budget은 4개 프리셋 중 하나로만 표현 (UI 칩과 매칭)

원칙 + 예시 시나리오 7개를 프롬프트 끝에 포함 (텍스트/가격비교/URL/이미지/취향 추가/예산 변경/일반 대화).

**답변 언어 주입**: 프로필·찜 브랜드 다음에 `formatLanguage()`가 선택 언어 지시를 최우선으로 덧붙임 — 친근한 톤은 유지하되 선택 언어로 답하고, 상품명·브랜드·판매처는 원문 그대로 둠. 클라이언트가 매 요청 `body`에 언어 코드를 실어 보냄 (미지정이면 Korean). 다국어 설계는 [`DECISIONS.md`](DECISIONS.md) ADR-016 참조.

---

## 응답 검증 전략

**환각 차단 3중 방어:**

1. **Tool 입출력 Zod 스키마 강제** — Vercel AI SDK의 `tool` API + `inputSchema`
2. **응답 후처리** — Tool 응답을 카드 UI로 렌더링할 때 다시 Zod 파싱 (`searchProductsOutputSchema`)
3. **시스템 프롬프트 금지 조항** — "Tool 응답 외 정보 답변 금지"

**실패 케이스 처리:**
- Tool 응답 빈 배열 → "매칭되는 결과가 없어요, 다른 키워드로 다시 찾아볼까요?"
- 네이버 API 실패 → 에러 토스트 + 다른 시도 제안
- 이미지 분석 실패 → "이미지에서 옷을 인식하지 못했어요" 후 텍스트로 다시 요청

---

## Agent 사고 과정 가시화

Vercel AI SDK는 Tool 호출을 streaming 이벤트로 노출 (`onToolCall`, `onToolResult`).
이를 UI에 그대로 흘려서 사용자에게 보여줍니다.

| Tool 호출 | 사용자 화면 표시 |
| --- | --- |
| `searchProducts` 시작/완료 | `🔧 무신사 상품 검색 중...` / `✓ 무신사 상품 검색 완료` |
| `comparePrices` 시작/완료 | `🔧 판매처 가격 비교 중...` / `✓ 판매처 가격 비교 완료` |
| `parseProductUrl` 시작/완료 | `🔧 URL 정보 추출 중...` / `✓ URL 정보 추출 완료` |
| `updateProfile` | 상태 표시 숨김 — 확인 카드(`ProfileUpdatePrompt`)로 대체 (ADR-009 업데이트) |

구현: [`src/components/ToolStatus.tsx`](../src/components/ToolStatus.tsx) (`LoaderIcon` 회전 / `CheckIcon` / `TriangleAlertIcon`)
+ AI 답변 시작 전 [`TypingIndicator`](../src/components/TypingIndicator.tsx) ("생각 중...")

→ 평가 핵심 2번(에이전트 흐름) 직접 어필.

---

## 프로필 데이터 모델

[`src/types/profile.ts`](../src/types/profile.ts)

```ts
profileSchema = z.object({
  styles: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  size: z.enum(['XS','S','M','L','XL']).optional(),
  budget: z.object({
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative().optional(),
  }).optional(),
})
```

**옵션 상수**:
- `STYLE_OPTIONS` — 캐주얼/미니멀/스트릿/빈티지/베이직/스포티/포멀/아메카지
- `POPULAR_BRANDS` — 무신사 스탠다드/유니폼브릿지/디스이즈네버댓/커버낫/앤더슨벨/아이앱 스튜디오/아디다스/나이키
- `SIZE_OPTIONS` — XS/S/M/L/XL
- `BUDGET_RANGES` — 5만 이하 / 5~15만 / 15~30만 / 30만 이상

**프로필 영속화**: [`src/utils/profile.ts`](../src/utils/profile.ts)의 `loadProfile`/`saveProfile`/`hasProfile`/`clearProfile`. localStorage key `sosie:profile`.

**프로필 주입**: [`src/app/api/chat/route.ts`](../src/app/api/chat/route.ts)의 `formatProfile()`가 한 줄 텍스트로 변환해 system prompt 끝에 append. 클라이언트는 매 요청 `useChat`의 `body` 옵션으로 프로필 + 자주 찜한 브랜드(`favoriteBrands`) + 선택 언어(`language`)를 함께 전송하고, 라우트는 `formatFavoriteBrands()`로 찜 브랜드를, `formatLanguage()`로 답변 언어 지시를 프롬프트에 덧붙임.

---

## 남은 작업

- [x] 프로필 학습 확인 단계 ("반영할까요?" 확인 카드) — ADR-009 업데이트
- [x] `comparePrices` 결과 카드 시각화 (가격비교 모달) — ADR-011 업데이트
- [x] 찜 기반 개인화 (찜 브랜드 검색·랭킹 반영) — ADR-013 업데이트
- [ ] 자유 budget 입력 UI 추가 (현재는 4개 프리셋만) — 프리셋 동기화 우선이라 보류
- [ ] `parseProductUrl` 결과 카드 시각화 (현재 텍스트만)
- [ ] Flash Lite의 내부 tool_code 누출 케이스 — 마무리 단계에서 full `gemini-2.5-flash`로 교체 시도 (free tier 20/day 한도 주의)
