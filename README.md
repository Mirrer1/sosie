# Sosie

> 옷 사고 싶은데 뭐 살지 모를 때, 같이 골라주는 AI 패션 스타일리스트.

**Sosie**(소지)는 프랑스어로 "닮은꼴". 사용자의 스타일·브랜드·사이즈·예산을 프로필로 기억해두고, 무신사 입점 상품 풀에서 어울리는 옷을 같이 골라주는 AI 에이전트입니다. 대화 중 흘러나오는 취향("사실 빈티지도 좋아해")은 알아서 프로필에 누적·반영합니다.

🔗 **라이브 데모**: https://sosie-theta.vercel.app/ — 로그인 없이 바로 사용 가능합니다.

---

## 무엇을 해결하나

옷은 자주 사는데, 막상 무신사에 들어가면 종류가 너무 많아 뭘 골라야 할지 막막하다. 친구한테 "골라줘" 하고 싶지만 그런 사람은 없고, 매번 "캐주얼 좋아하고 무신사 스탠다드 자주 입고 예산 5~15만" 같은 맥락을 검색창에 풀어 쓰기도 귀찮다. 같은 옷이 무신사·공식몰·자사몰에서 가격이 다 다른데 어디가 이득인지 머릿속 계산도 안 된다.

Sosie는 이 맥락을 **프로필로 한 번 받아두고**, 시드(텍스트·이미지·URL)에 매번 곱해서 골라준다. 단순 키워드 검색이 아니라 다단계 Tool 호출로 검색·비교·추천하고, 대화하며 새로 나온 취향은 프로필에 자동으로 쌓인다. 무신사를 택한 건 국내 패션 1위 플랫폼이라 카탈로그가 풍부하고, 입점 브랜드 + 공식몰 연동 구조에서 "같은 상품 다른 판매처" 문제가 자연스럽게 발생하기 때문.

---

## 핵심 기능

- 💬 **채팅 인터페이스** — Streaming 답변 + 상품 카드 임베드
- 🖼️ **멀티모달 입력** — 텍스트 + 이미지 (picker / 드래그앤드롭 / 클립보드 paste), Gemini vision
- 🤖 **다단계 Tool 호출 (4종)** — 상품 검색 / 가격 비교 / URL 파싱 / 프로필 업데이트
- 👁️ **Agent 사고 과정 가시화** — Tool 호출 단계를 실시간으로 노출
- 🛍️ **무신사 풀 검색** — 네이버 쇼핑 API + 무신사 입점 필터
- 🏷️ **카드 클릭 → 판매처별 가격 비교** — 가격 정렬·최저가 뱃지, 모델코드/브랜드 필터로 동일 상품 정확도 강화
- 👤 **사용자 프로필** — 첫 진입 시 마법사(스타일·브랜드·사이즈·예산), 헤더에서 언제든 수정
- 🧠 **대화 중 프로필 자동 학습** — "사실 빈티지도 좋아해" → 프로필에 누적 → 다음 추천에 반영
- ❤️ **상품 찜/북마크** — 카드 하트로 저장, 헤더 찜 목록에서 모아보기
- ✨ **디테일** — 메시지·카드 등장 애니메이션, 스마트 자동 스크롤, 검색 실패/빈결과 안내, 다크모드

---

## 동작 구조

> 자세한 설계: [`docs/AGENT.md`](docs/AGENT.md)

AI는 답을 지어내지 않는다. 옷 키워드가 보이면 도구(Tool)를 호출해 **실제 데이터**(네이버 쇼핑)를 가져와 답한다.

| Tool | 입력 | 출력 |
| --- | --- | --- |
| `searchProducts` | 키워드/브랜드/가격대/`includeOtherMalls` | 무신사 입점 상품 배열 |
| `comparePrices` | 상품명 | 판매처별 가격 (동일 로직을 `/api/compare-prices` 라우트로도 노출 — 카드 모달이 호출) |
| `parseProductUrl` | URL | OG 메타 (제목/이미지/설명) |
| `updateProfile` | 변경 필드 + `mode`(merge/replace) + `reason` | 클라가 받아 localStorage에 반영 |

이미지는 별도 Tool 없이 Gemini 멀티모달 native로 처리. 모든 Tool 입출력은 **Zod 스키마로 검증**해 환각·형식 오류를 차단한다.

```
[클라] 입력(텍스트/이미지/URL) + 프로필 → POST /api/chat
   → Gemini Flash Lite + Tool Calling (max 5 step)
      ├ searchProducts  → 네이버 쇼핑 (무신사 필터)
      ├ comparePrices   → 네이버 쇼핑 (카드 모달은 /api/compare-prices 동일 함수)
      ├ parseProductUrl → OG 파싱
      └ updateProfile   → 클라가 localStorage 머지/교체
   → Streaming 응답 + Tool 상태 + 상품 카드
   → localStorage 자동 영속화 (sosie:messages, sosie:profile, sosie:favorites)
```

---

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI | shadcn/ui (Base UI 기반) + motion |
| LLM | Google Gemini Flash Lite (`gemini-flash-lite-latest`) |
| AI 통합 | Vercel AI SDK v6 (`useChat`, Tool Calling, Streaming) |
| 스키마 검증 | Zod (Tool 입출력 + 프로필/찜 schema) |
| 상품 검색 | 네이버 쇼핑 검색 API (무신사 입점 필터) |
| URL 파싱 | open-graph-scraper |
| 영속화 | localStorage (`sosie:profile` / `sosie:messages` / `sosie:favorites`) |
| 다크모드 | next-themes |
| 테스트 | Vitest |
| 호스팅 | Vercel |
| 코드 퀄리티 | ESLint + Prettier + Husky + lint-staged |

---

## 까다로웠던 부분

### 프로필 → 검색 → 답변 → 프로필, 닫힌 루프

단발성 검색 wrapper로 보이지 않으려면 사용자 컨텍스트가 누적돼야 한다. 매 요청에 프로필을 주입(`useChat`의 `body` → system prompt)하고, 대화 중 취향 단서가 나오면 AI가 `updateProfile`을 호출한다. 단, 서버 Tool은 localStorage에 닿지 못하므로 "이렇게 바꿔라"는 신호만 만들고, 실제 저장은 클라이언트가 한다. 다음 검색부터 갱신된 프로필이 자동으로 곱해진다.

### 가격 비교 — 같은 상품을 어떻게 가려내나

상품명을 그대로 검색하면 `[브랜드]`·`(색상)`·모델코드가 검색을 방해하고, 같은 브랜드의 **다른 모델**이 섞여 들어온다. 핵심 인사이트는 모델코드의 앞부분(`CTCDDC004`NV → `CTCDDC004`)이 진짜 제품 식별자라는 점. 검색어를 정제하고, 결과는 브랜드 일치 + 모델코드 충돌 제외 + 토큰 겹침으로 거른다. 다만 코드가 없는 동일 브랜드 다른 모델은 못 거르는데, 이는 네이버 역검색 구조의 한계로 받아들였다. (자세히: [`docs/DECISIONS.md`](docs/DECISIONS.md) ADR-012)

### Flash Lite 길들이기

무료 티어 모델은 Tool 호출에 보수적이라 자꾸 되묻는다. 시스템 프롬프트에 행동 원칙 8개 + few-shot 예시를 넣어 "옷 키워드가 보이면 묻지 말고 즉시 검색"하도록 강제했다. Tool 사고 과정(`input-streaming`/`output-available`/`output-error`)은 `ToolStatus`로 실시간 노출해 에이전트답게 보이도록 했다.

> 주요 의사결정과 트레이드오프는 [`docs/DECISIONS.md`](docs/DECISIONS.md)에 ADR로 정리.

---

## 현재 한계

- **단일 기기** — 인증/DB 없이 localStorage라 기기 간 동기화 X
- **이미지 시드 정밀도** — Flash Lite 한계로 소재/실루엣 같은 디테일 키워드가 들쭉날쭉
- **자유 budget** — AI는 자유 금액을 받지만 UI 칩이 4개 프리셋이라 매핑 시 의도 일부 손실 ("20만" → 15~30만)
- **명시 학습만** — 취향은 발화 기반으로만 학습. 클릭/찜 이력 기반 implicit 학습은 미적용

---

## 로컬 실행

```bash
npm install

# 환경변수 — .env.example 복사 후 키 채우기
cp .env.example .env.local

npm run dev          # http://localhost:3000
npm run build && npm start
npm test             # Vitest
```

**필요 키**
- `GOOGLE_GENERATIVE_AI_API_KEY` — https://aistudio.google.com
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` — https://developers.naver.com

---

개발은 **Claude Code**와 페어로 진행했고, AI 협업 컨텍스트를 `CLAUDE.md`(코드 규칙) · [`docs/AGENT.md`](docs/AGENT.md)(설계) · [`docs/DECISIONS.md`](docs/DECISIONS.md)(의사결정)로 분리해 일관된 방향을 유지했습니다.
