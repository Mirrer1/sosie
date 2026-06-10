# Sosie

> 옷 사고 싶은데 뭐 살지 모를 때, 같이 골라주는 AI 패션 스타일리스트.

**Sosie**(소지)는 프랑스어로 "닮은꼴"이라는 뜻입니다. 사용자의 스타일·브랜드 취향·사이즈·예산을 프로필로 받아두고, 무신사 입점 상품 풀에서 어울리는 옷을 같이 골라주는 AI 에이전트입니다. 대화하면서 새로 흘러나오는 취향은 알아서 프로필에 누적·반영합니다.

---

## 🔗 빠른 접근

- **배포 URL**: TODO (Vercel 배포 후 갱신)
- **테스트 계정**: 익명 사용 — 별도 로그인 불필요
- **시연 영상**: TODO (3분 컷, 녹화 후 링크)

---

## 1. 문제 정의

### 페르소나

**무신사 헤비유저 (개발자 본인)**

- 옷을 자주 사고 좋아함
- 무신사 / 29CM / 브랜드 공식몰을 자주 오감
- 트렌드에 민감, 한 가지 스타일이 떠도 곧바로 구매 안 하고 비교부터 함
- 가성비 + 디자인 둘 다 챙김

### 페인 시나리오

1. **옷 사고 싶긴 한데 뭘 살지 막막함** — 무신사 들어가서 카테고리 봐도 종류가 너무 많고, 그중에 나한테 어울리는 게 뭔지 모르겠음. 친구나 스타일리스트한테 "골라줘" 하고 싶은데 그런 사람 없음.
2. **취향은 있는데 매번 말로 풀어 검색하기 귀찮음** — "캐주얼 좋아하고 무신사 스탠다드 자주 입고 5~15만 예산" 같은 맥락을 검색할 때마다 매번 떠올려서 키워드로 풀어내야 함. 사용자가 누군지 검색창은 모름.
3. **같은 상품, 다른 판매처** — 같은 옷이 무신사·공식몰·자사몰에서 다 팔리는데 가격/혜택이 다 다름. 어디가 진짜 이득인지 머릿속 계산 안 됨.
4. **영감 받은 옷이 비슷한 다른 거** — 인스타에서 본 옷이 마음에 드는데 가격 비싸거나 품절. "이거랑 비슷한 다른 옷"을 검색어로 표현하기 어려움. 사진은 있는데.

### 시장 인사이트 (왜 무신사인가)

- 국내 패션 1위 플랫폼 — 카탈로그 가장 풍부
- 본인이 헤비유저라 진짜 페인 살아서 알고 있음
- 입점 브랜드 + 공식몰 연동 구조 → "같은 상품 다른 판매처" 페인이 자연스럽게 발생
- 트렌드 발신지 — "요즘 이거 핫함" 정보가 모이는 곳

### 해결 가설

AI 에이전트가 **사용자 프로필**(스타일/브랜드/사이즈/예산)을 미리 받아두고, 시드(텍스트/이미지/URL)에 프로필을 매번 곱해서 무신사 풀에서 "이거 어떠세요" 골라줌. 단순 키워드 검색 X, 다단계 Tool 호출로 판단·비교·추천. **대화하면서 새로 흘러나오는 취향(`사실 빈티지도 좋아해`)은 알아서 프로필에 누적·반영** — 매번 같은 맥락 떠올려 풀어 말할 필요 없음.

---

## 2. 주요 기능

- 💬 **채팅 인터페이스** — Streaming 답변 + 상품 카드 임베드
- 🖼️ **멀티모달 입력** — 텍스트 + 이미지 업로드 (Gemini vision)
- 🤖 **AI Agent 다단계 Tool 호출 (4종)** — 상품 검색 / 가격 비교 / URL 파싱 / 프로필 업데이트
- 👁️ **Agent 사고 과정 가시화** — Tool 호출 단계를 실시간으로 사용자에게 노출
- 🛍️ **무신사 풀 검색** — 네이버 쇼핑 API + 무신사 입점 필터로 카탈로그 한계 없음
- 🏷️ **카드 클릭 → 판매처별 가격 비교 모달** — 추천 카드에서 1-click으로 여러 판매처 가격 정렬·최저가 뱃지, 각 판매처로 바로 구매
- 👤 **사용자 프로필** — 첫 진입 시 4단계 마법사 (스타일·브랜드·사이즈·예산), 헤더 버튼으로 언제든 수정
- 🧠 **대화 중 프로필 자동 학습** — "사실 빈티지도 좋아해" → `updateProfile` Tool이 프로필에 누적 → 다음 추천에 반영
- 💾 **대화 히스토리 자동 저장** — localStorage (새로고침 안전)
- 🌓 **다크모드 토글**

---

## 3. 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui (Base UI 기반) |
| LLM | Google Gemini Flash Lite (`gemini-flash-lite-latest`) |
| AI 통합 | Vercel AI SDK v6 (`useChat`, Tool Calling, Streaming) |
| 스키마 검증 | Zod (Tool 입출력 + 프로필 schema) |
| 상품 검색 API | 네이버 쇼핑 검색 (무신사 입점 필터) |
| URL 파싱 | open-graph-scraper |
| 상태 (채팅) | `useChat` 훅 |
| 상태 (프로필/히스토리) | localStorage (`sosie:profile`, `sosie:messages`) |
| 다크모드 | next-themes |
| 테스트 | Vitest |
| 호스팅 | Vercel (Hobby Free) |
| 코드 퀄리티 | ESLint + Prettier + Husky + lint-staged |

---

## 4. 실행 방법

```bash
# 의존성 설치
npm install

# 환경변수 셋업 — .env.example 복사해서 키 채우기
cp .env.example .env.local
# .env.local에 값 채우기

# 개발 서버
npm run dev
# http://localhost:3000

# 빌드
npm run build && npm start
```

**필요 키:**
- `GOOGLE_GENERATIVE_AI_API_KEY` — https://aistudio.google.com (무료)
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` — https://developers.naver.com (무료)

---

## 5. LLM / Agent 동작 구조

> 자세한 설계: [`docs/AGENT.md`](docs/AGENT.md)

### Tool 4개 + 멀티모달 native

| Tool | 입력 | 출력 |
| --- | --- | --- |
| `searchProducts` | 키워드/브랜드/가격대/`includeOtherMalls` | 무신사 입점 상품 배열 (네이버 쇼핑 API 필터) |
| `comparePrices` | 상품명 | 판매처별 가격 비교 (동일 로직을 `/api/compare-prices` 라우트로도 노출 — 카드 클릭 모달이 호출) |
| `parseProductUrl` | URL | OG 메타 (제목/이미지/설명) |
| `updateProfile` | 변경된 프로필 필드(스타일/브랜드/사이즈/예산) + `mode`(merge/replace) + `reason` | 클라이언트가 결과 받아 localStorage에 반영 |

이미지 입력은 Gemini 멀티모달 native로 처리 — 별도 Tool 없이 사용자 메시지의 file part로 전달.

### 흐름 예시 (프로필 보유, 텍스트 시드)

```
프로필: 캐주얼·무신사 스탠다드·M·5~15만
사용자: "청바지 추천해줘"
  ↓
Agent: searchProducts({ keywords: ["청바지","데님"], brand: "무신사 스탠다드", priceMin: 50000, priceMax: 150000 })
  ↓
Agent: "캐주얼 좋아하시니까, 무신사 스탠다드 와이드 데님 어때요? 예산 안에서 베이직하게…" + 카드 그리드
```

### 흐름 예시 (대화 중 취향 학습)

```
사용자: "사실 빈티지도 좋아해"
  ↓
Agent: updateProfile({ styles: ["빈티지"], mode: "merge", reason: "사용자가 빈티지 스타일 추가 언급" })
  ↓
클라이언트: 결과를 받아 localStorage의 프로필에 누적
  ↓
Agent 답변: "프로필에 반영했어요. 빈티지한 셔츠도 찾아드릴까요?"
  ↓ (다음 검색부터 styles에 "빈티지" 자동 포함)
```

모든 Tool 응답은 **Zod 스키마로 검증** → LLM 환각/형식 오류 차단.

---

## 6. 데이터 흐름

```
사용자 입력 (텍스트 / 이미지 첨부 / 텍스트에 URL 포함)
  + 클라이언트가 매 요청 body에 sosie:profile 첨부
  ↓
Next.js Route Handler (/api/chat)
  ↓ system prompt에 프로필을 동적 한 줄 주입
Vercel AI SDK + Gemini Flash Lite (멀티모달 native)
  ↓ (Tool Calling, stopWhen: stepCountIs(5))
[ searchProducts  ] → 네이버 쇼핑 검색 API (무신사 입점 필터)
[ comparePrices   ] → 네이버 쇼핑 검색 API (동일 로직 /api/compare-prices 로도 노출, 카드 클릭 모달 전용)
[ parseProductUrl ] → open-graph-scraper
[ updateProfile   ] → 입력 echo (실제 적용은 클라이언트가 결과 받아 localStorage 머지/교체)
(이미지)             → Gemini 멀티모달 native, 별도 Tool 없음
  ↓ (Streaming 응답 + Tool 상태 + 상품 카드 데이터)
useChat 훅 → ChatMessage 마크다운 + ToolStatus + ProductGrid + ImageLightbox
  ↓
대화는 sosie:messages, 프로필은 sosie:profile로 localStorage 자동 영속화
(헤더의 지우개 버튼으로 대화 초기화 / 프로필 버튼으로 마법사 재오픈)
```

---

## 7. 본인이 중점적으로 구현한 부분

- **AI 패션 스타일리스트 컨셉 + 프로필 루프** — 사용자 프로필(스타일/브랜드/사이즈/예산)을 매 요청에 곱하고, 대화 중 흘러나오는 취향은 `updateProfile` Tool로 누적 → 다음 검색에 자동 반영. "프로필 → 검색 → 답변 → 프로필 업데이트" 닫힌 에이전트 루프
- **AI Agent 다단계 Tool Calling 흐름 설계** — 사용자 시드 종류(텍스트/이미지/URL)에 따라 Agent가 Tool을 어떤 순서로 호출할지 시스템 프롬프트 원칙 8개 + few-shot 예시로 가이드 (Flash Lite의 보수적 Tool 호출 성향 보완)
- **Agent 사고 과정 가시화** — `useChat`의 tool part state(`input-streaming`/`output-available`/`output-error`)를 `ToolStatus` 컴포넌트로 실시간 노출 (회전 `LoaderIcon` → `CheckIcon`)
- **Zod 스키마 강제** — Tool 입출력 + 프로필 schema에 Zod 박아 LLM 환각/스키마 오류 차단
- **멀티모달 이미지 입력** — 파일 picker / 드래그앤드롭 / 클립보드 paste 3가지 입력 + 5MB·jpeg/png/webp 검증 + 미리보기 + 확대 라이트박스
- **상품 카드 그리드 + 판매처 비교 모달** — Tool 결과를 `ProductGrid`로 시각화, 카드 클릭 시 `comparePrices` 로직을 그대로 재사용해 판매처별 가격 인플레이스 표시(가격 오름차순/최저가 뱃지/각 판매처 직접 구매 링크). 네이버 차단 URL은 검색 페이지로 우회
- **대화·프로필 영속화** — localStorage 자동 저장/복원 (`sosie:messages`, `sosie:profile`) + 헤더 지우개 버튼(대화) / 사람 아이콘(프로필) 으로 컨트롤
- **온보딩 마법사 4단계** — 첫 진입 시 칩 토글 기반 (스킵 가능, 다 선택사항). 헤더 버튼으로 언제든 재오픈, 열 때마다 현재 저장값으로 prefill

---

## 8. 구현하지 못한 부분

- **Supabase Auth + 영구 저장 DB** — 익명 사용으로 진입 마찰 제거를 우선시. 프로필/대화는 localStorage 단일 기기. V2로 분리.
- **다중 대화 세션** — ChatGPT 같은 사이드바 세션 목록. 현재는 단일 세션 + 지우개 버튼 초기화. V2로.
- **공유 링크** — 대화 결과를 URL로 공유. V2.
- **`comparePrices` / `parseProductUrl` 결과 시각화** — 현재 텍스트 답변으로만 표시 (`searchProducts`만 카드 그리드). 동일 패턴으로 확장 가능, 시간 보고 결정.
- **이미지 시드의 정밀도** — Gemini Flash Lite가 이미지에서 카테고리·스타일을 추출하지만, 디테일(소재/실루엣) 정밀도는 한계. 동일 사진이라도 검색 키워드가 들쭉날쭉.
- **자유 budget 표현 UI** — 대화에선 "20만원까지" 같은 자유 금액을 받지만 UI 칩이 4개 프리셋이라, AI가 가장 가까운 프리셋으로 매핑하면서 의도 일부 손실 (예: 20만 → 15~30만으로 표시).
- **프로필 학습의 신뢰 단계** — 현재 AI가 감지하면 즉시 반영. 추후 "이거 프로필에 추가할까요?" 사용자 확인 단계 추가 가능.

---

## 9. 향후 개선 방향

- **인증/영구 저장** — Supabase Auth + PostgreSQL (프로필·대화를 기기 간 동기화)
- **다중 세션 + 공유** — ChatGPT 스타일 사이드바, URL 공유
- **장기 개인화** — 사용자 클릭/찜 이력 기반 implicit 학습 (현재는 명시 발화 기반 explicit 학습)
- **자유 budget UI** — 칩 프리셋 + "직접 입력" 추가해서 AI 자유 금액과 UI 동기화
- **무신사 파트너 API/자체 크롤러** — 네이버 쇼핑 응답 형태 의존 줄이고 더 풍부한 메타(태그/유저 평점) 활용
- **결제 연동** — 직접 구매까지 흐름 통합

---

## 10. AI 개발 도구 활용 여부

**Claude Code (Anthropic)** 를 사용했습니다.

| 항목 | AI 활용 | 직접 작업 |
| --- | --- | --- |
| 보일러플레이트 / 셋업 명령어 | ✅ | |
| 타입 정의 / Zod 스키마 초안 | ✅ | 검증/조정 |
| 디버그 보조 | ✅ | |
| 코드 리뷰 보조 | ✅ | |
| **문제 정의 / 페르소나 / 페인 도출** | 보조 | **직접** |
| **Agent 흐름 / Tool 설계** | 보조 | **직접** |
| **시스템 프롬프트 튜닝** | 보조 | **직접** |
| **UI/UX 결정 (카드 형태, 사고 과정 UX 등)** | 보조 | **직접** |
| **프로필 schema 설계 + 자동 학습 루프 흐름** | 보조 | **직접** |
| **트레이드오프 결정 (스택/인증/저장 방식)** | 보조 | **직접** (`docs/DECISIONS.md`) |

> AI는 구현 속도와 코드 품질을 보조했고, **제품/설계/판단**은 직접 했습니다.
> 모든 주요 결정과 이유는 [`docs/DECISIONS.md`](docs/DECISIONS.md)에 기록했습니다.

---

## 📂 문서 구조

```
sosie/
├── README.md            # ← 지금 보는 문서 (평가자용 entry)
├── CLAUDE.md            # AI 협업 컨텍스트 (코드 규칙)
└── docs/
    ├── AGENT.md         # LLM Agent 설계 + Tool 명세 + 데이터 소스
    └── DECISIONS.md     # 주요 결정 + 트레이드오프 (ADR)
```
