# Sosie

> 닮은 옷 다 모아드려요. 트렌드 추종형 쇼핑을 위한 AI 에이전트 도우미.

**Sosie**(소지)는 프랑스어로 "닮은꼴, 도플갱어"라는 뜻입니다. 한 가지 스타일이 뜨면 여러 브랜드에서 비슷한 상품이 우후죽순 나오는 패션 쇼핑 환경에서, AI 에이전트가 비슷한 상품을 다단계로 검색·비교·추천해주는 서비스입니다.

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

1. **트렌드 따라 비슷한 옷 5개 브랜드** — 발마칸 코트가 뜨면 5개 브랜드에서 비슷한 게 동시에 나옴. 가격 12~25만원 들쭉날쭉, 디자인 미세하게 다 다름. 일일이 비교 머리 아픔.
2. **같은 상품, 다른 판매처** — 같은 코트가 무신사·공식몰·자사몰에서 다 팔리는데 가격/혜택이 다 다름. 어디가 진짜 이득인지 머릿속 계산 안 됨.
3. **영감 받은 옷의 비슷한 다른 거** — 인스타에서 본 옷이 마음에 드는데 가격 비싸거나 품절. "이거랑 비슷한 다른 옷"을 검색어로 표현하기 어려움. 사진은 있는데.
4. **카테고리는 알겠는데 어떤 스타일이 트렌디한지** — "와이드 진" 트렌드인 건 아는데, 그중에서 핫한 핏/브랜드 모름. 잡지/인스타 뒤지기 귀찮음.

### 시장 인사이트 (왜 무신사인가)

- 국내 패션 1위 플랫폼 — 카탈로그 가장 풍부
- 본인이 헤비유저라 진짜 페인 살아서 알고 있음
- 입점 브랜드 + 공식몰 연동 구조 → "같은 상품 다른 판매처" 페인이 자연스럽게 발생
- 트렌드 발신지 — "요즘 이거 핫함" 정보가 모이는 곳

### 해결 가설

AI 에이전트가 사용자 시드(텍스트/이미지/URL) 받아서 트렌드 카탈로그 검색 → 판매처별 가격 비교 → "이거 사세요" 명확한 추천까지 한 번에. 단순 키워드 검색 X, 다단계 Tool 호출로 판단·비교·추천.

---

## 2. 주요 기능

- 💬 **채팅 인터페이스** — Streaming 답변 + 상품 카드 임베드
- 🖼️ **멀티모달 입력** — 텍스트 + 이미지 업로드 (Gemini vision)
- 🤖 **AI Agent 다단계 Tool 호출** — 카탈로그 검색 / 가격 비교 / URL 파싱 / 이미지 분석
- 👁️ **Agent 사고 과정 가시화** — Tool 호출 단계를 실시간으로 사용자에게 노출
- 🛍️ **무신사 트렌드 카탈로그** — 직접 큐레이션한 30~40개 상품
- 💾 **대화 히스토리 자동 저장** — localStorage (새로고침 안전)
- 🌓 **다크모드 토글**

---

## 3. 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 폼 | react-hook-form + Zod |
| LLM | Google Gemini 2.0 Flash |
| AI 통합 | Vercel AI SDK (`useChat`, Tool Calling, Streaming) |
| 스키마 검증 | Zod (LLM 응답 + 폼) |
| 외부 API | 네이버 쇼핑 검색 |
| URL 파싱 | open-graph-scraper |
| 상태 (채팅) | `useChat` 훅 (자동) |
| 상태 (히스토리) | localStorage |
| 모션 | Framer Motion |
| 다크모드 | next-themes |
| 테스트 | Vitest |
| 호스팅 | Vercel (Hobby Free) |
| 코드 퀄리티 | Prettier + Husky + lint-staged |

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

### Tool 4개

| Tool | 입력 | 출력 |
| --- | --- | --- |
| `searchCatalog` | 키워드/카테고리/태그 | 매칭 상품 배열 |
| `analyzeImage` | base64 이미지 | 스타일 키워드 |
| `comparePrices` | 상품명 | 판매처별 가격 |
| `parseProductUrl` | URL | OG 메타 |

### 흐름 예시 (텍스트 시드)

```
사용자: "발마칸 코트 추천해줘"
  ↓
Agent: searchCatalog({ category: "발마칸 코트" })
  ↓
Agent: comparePrices({ productName: "유니폼브릿지 발마칸" })
  ↓
Agent: 카드 그리드 + 추천 이유 응답 (Streaming)
```

모든 Tool 응답은 **Zod 스키마로 검증** → LLM 환각/형식 오류 차단.

---

## 6. 데이터 흐름

```
사용자 입력 (텍스트/이미지/URL)
  ↓
Next.js Route Handler (/api/chat)
  ↓
Vercel AI SDK + Gemini 2.0 Flash
  ↓ (Tool Calling)
[ searchCatalog ] → src/data/catalog.json (직접 큐레이션)
[ comparePrices ] → 네이버 쇼핑 API
[ parseProductUrl ] → open-graph-scraper
[ analyzeImage ]  → Gemini 멀티모달
  ↓ (Streaming 응답 + 상품 카드 데이터)
useChat 훅 → ChatMessage 컴포넌트 + ProductCard 그리드
```

---

## 7. 본인이 중점적으로 구현한 부분

- **AI Agent 다단계 Tool Calling 흐름 설계** — 사용자 시드 종류(텍스트/이미지/URL)에 따라 Agent가 Tool을 어떤 순서로 호출할지 시스템 프롬프트로 가이드
- **Agent 사고 과정 가시화** — Vercel AI SDK의 Tool 호출 streaming 이벤트를 UI로 노출 (`🔧 카탈로그 검색 중...`)
- **Zod 스키마 강제** — Tool 입출력에 Zod 스키마 박아 LLM 환각/스키마 오류 차단
- **무신사 트렌드 카탈로그 큐레이션** — 본인 페르소나 인사이트 그대로 데이터 설계에 반영

---

## 8. 구현하지 못한 부분

- **URL 입력 모드** — Phase 5에 OG 파싱은 들어갔지만 UI/UX 완성도는 부족 (시간 보고 결정)
- **Supabase Auth + 영구 저장 DB** — 익명 사용으로 진입 마찰 제거를 우선시. V2로 분리.
- **자체 카탈로그 크롤링 파이프라인** — 무신사 파트너 API 미보유로 직접 크롤링은 약관 리스크. 30개 큐레이션으로 MVP. V2로.
- **다중 대화 세션** — ChatGPT 같은 사이드바 세션 목록. localStorage 단일 세션만 MVP.
- **공유 링크** — 대화 결과를 URL로 공유. V2.

---

## 9. 향후 개선 방향

- **자체 카탈로그 확장** — 무신사 파트너 API 또는 자체 크롤링 파이프라인 구축
- **인증/영구 저장** — Supabase Auth + PostgreSQL
- **다중 세션 + 공유** — ChatGPT 스타일 사이드바, URL 공유
- **개인화 추천** — 사용자 히스토리 기반 스타일 학습
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
| **카탈로그 큐레이션 (어떤 상품 / 카테고리 / 가격대)** | | **직접** |
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
