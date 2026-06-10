# 주요 결정 (Architecture Decision Records)

> 각 결정의 **배경 / 결정 / 이유 / 트레이드오프 / 대안 / 향후 재검토 조건** 기록.

---

## ADR-001: DB 없이 localStorage로 데이터 저장

**상태**: Accepted

**배경**: 대화 히스토리 / 찜 같은 사용자 데이터를 어디에 저장할지.

**결정**: **localStorage** 만 사용. Supabase / Postgres / Redis 등 외부 DB 미도입.

**이유**:
- 평가자가 사이트 진입 시 **로그인/가입 절차 없이 바로 사용** 가능
- MVP 데모 단계에서는 영구 저장의 가치보다 진입 마찰 제거가 큼
- 대화 데이터는 본질적으로 1세션 단위. 다른 기기 동기화 가치 낮음

**트레이드오프**:
- ❌ 다른 기기 / 브라우저에서 안 보임
- ❌ 데이터 분석 / 운영 인사이트 X
- ✅ 평가자 즉시 시연 가능
- ✅ 인프라 비용 0원
- ✅ 인증 시스템 구축 시간 절약 → AI Agent 품질에 집중

**대안 및 기각 이유**:
- Supabase 익명 로그인 + DB → 우대사항(Supabase) 어필 가능하나 작업 +0.5일. **시간 우선순위에서 후순위**.
- NextAuth + 소셜 3종 → 우대사항에 NextAuth 없음. 작업 2~3일. **비효율**.

**향후 재검토 조건**:
- 실서비스 단계 진입 시 → Supabase Auth + PostgreSQL 도입 (README 향후 개선에 명시)

---

## ADR-002: LLM은 Gemini 2.5 Flash Lite (현재)

**상태**: Accepted (모델 변경 이력 있음)

**배경**: 어떤 Gemini 모델을 쓸지. 초기 계획은 `gemini-2.0-flash`였으나 실제 사용 중 quota/안정성 문제로 두 번 갈아끼움.

**결정 (현재)**: **`gemini-2.5-flash-lite`** (Google AI Studio free tier 1,500/day)

**모델 선택 이력**:
1. **`gemini-2.0-flash`** — 첫 시도 → 429 Quota Exceeded (`limit: 0`). 이 계정의 free tier 할당이 0이라 사용 불가
2. **`gemini-2.5-flash`** (full) — 두 번째 시도 → 동작은 하지만 free tier **하루 20회** 한도. 개발/평가 도중 빠르게 소진
3. **`gemini-2.5-flash-lite`** — 세 번째 시도 → free tier 1,500/day, 멀티모달 + Tool Calling 모두 동작. 현재 사용 중

**이유**:
- **무료 + 충분한 한도** — 평가자가 수십 번 메시지 보내도 한도 여유
- **멀티모달 native** — 이미지 입력이 핵심 기능
- **Tool Calling 안정** (강화된 시스템 프롬프트 + few-shot 예시 조합으로 lite도 Tool 호출 잘 결정함)

**트레이드오프**:
- ✅ 비용 0원, 안정적 한도
- ✅ 멀티모달 강점
- ❌ Full `gemini-2.5-flash` 대비 reasoning 품질 약간 약함 — 가끔 내부 `<tool_code>` 호출 코드를 텍스트로 누출
- ❌ 한국어 추론 품질 Claude Sonnet 대비 미세하게 떨어짐 (체감)

**대안 및 기각 이유**:
- **Claude Sonnet 4.6** — 품질 가장 좋지만 비용 발생. 우대사항에 Claude도 포함이라 시연 직전 잠깐 갈아끼움 검토 가능
- **GPT-4o** — 무난. 비용. 차별성 X

**향후 재검토**:
- Vercel AI SDK가 provider 추상화하니 시연 직전 `gemini-2.5-flash` (full) 또는 Claude/GPT-4o로 잠깐 갈아끼우는 옵션 있음
- 단 full 2.5-flash는 20/day 한도라 마무리 시점에만 시도

---

## ADR-003: 익명 사용 (로그인 X)

**상태**: Accepted

**배경**: 로그인 시스템을 넣을지 말지.

**결정**: **로그인 없음. 익명 사용.**

**이유**:
- 평가자 사이트 접속 → **즉시 사용** 가능 (가입/로그인 절차 X)
- 데이터는 어차피 localStorage에 1세션 단위로 보관 → 인증 없어도 OK
- 인증 구축 시간(1~3일)을 AI Agent 품질에 투자

**트레이드오프**:
- ✅ 평가자 시연 마찰 0
- ✅ 작업 시간 절약
- ❌ "기본 기능 빠졌네" 인상 가능성 → README "구현하지 못한 부분" + "향후 개선"에 명시로 커버
- ❌ 우대사항 Supabase Auth 어필 못 함

**프레이밍**:
> "안 만든 게 아니라, **의도적으로 익명 사용으로 설계**. 평가자 진입 마찰 제거 + AI 품질에 시간 집중."

---

## ADR-004: 데이터 소스는 큐레이션 + 네이버 API + OG 파싱 하이브리드

**상태**: Accepted

**배경**: 무신사 직접 크롤링은 불가능 (약관/Cloudflare). 대안 필요.

**결정**:
- **메인**: 직접 큐레이션한 30~40개 카탈로그 (`src/data/catalog.json`)
- **가격 비교**: 네이버 쇼핑 검색 API
- **URL 입력**: OG 파싱

**이유**:
- **큐레이션** — 시연 안정성 100% + 본인 PM 인사이트(무신사 헤비유저) 자연스럽게 살림
- **네이버 API** — 사용자 인사이트("같은 상품 다른 판매처") 반영. 가격 비교 자연스러움
- **OG 파싱** — URL 던지면 큐레이션 외 상품도 처리 가능

**트레이드오프**:
- ✅ 시연 안정성
- ✅ 진짜 무신사 이미지/URL 사용 (카드 클릭 → 실제 무신사 페이지)
- ✅ Tool 3개로 Agent 다단계 흐름 자연스러움
- ❌ 카탈로그 범위 제한 (30~40개)
- ❌ 본인 큐레이션 노력 (반나절)

**대안 및 기각 이유**:
- **무신사 직접 크롤링** — Cloudflare 차단 + 약관 위반 + 시연 중 차단 시 망함
- **네이버 API만** — 결과 광고/잡상품 섞임 + 패션 큐레이션 톤 약함
- **AI가 가짜 상품 생성** — 환각, 평가 마이너스

**향후 재검토**:
- 실서비스 단계 → 무신사 파트너 API 신청 또는 자체 크롤링 파이프라인 구축 (README 향후 개선에 명시)

---

## ADR-005: 문서를 4개로 분할 (README + CLAUDE + docs 2종)

**상태**: Accepted

**배경**: 단일 MD vs 분할.

**결정**: README / CLAUDE / docs/AGENT / docs/DECISIONS — **4개 분할**.

**이유**:
- AI 회사 평가자에게 **"문서화 + AI 협업 워크플로"** 보여줌
- 각 문서가 단일 책임 (평가자용 entry / AI 컨텍스트 / Agent 깊이 / 결정 기록)
- 작업 중 git log에서 문서가 코드와 함께 진화하는 흔적 → 진정성

**구조**:
- `README.md` — 평가자 entry, 문제 정의 깊이 있음, 12개 항목
- `CLAUDE.md` — Claude Code 등 AI 어시스턴트용 컨텍스트, 코드 규칙
- `docs/AGENT.md` — Tool 명세 + 데이터 소스 + 흐름 + 시스템 프롬프트
- `docs/DECISIONS.md` — 이 문서, ADR 기록

**트레이드오프**:
- ✅ 문서화 능력 어필
- ✅ AI 협업 진정성
- ✅ docs 2개로 압축해 유지보수 부담 적음
- ❌ 단일 README 대비 약간의 분산

---

## ADR-006: 외부 이미지는 `<img>` 사용, `next/image` 미도입

**상태**: Accepted

**배경**: ProductCard에서 무신사·29CM·네이버쇼핑·브랜드몰 등 다양한 도메인 이미지를 표시.

**결정**: 일반 `<img>` 태그 사용. `eslint.config.mjs`에서 `@next/next/no-img-element` 룰 끔.

**이유**:
- `next/image`는 `next.config.ts`의 `remotePatterns`에 도메인별 등록 필요
- 카탈로그 확장 시 다양한 쇼핑몰/브랜드몰 도메인 추가됨 → 매번 config 수정 부담
- MVP 단계 이미지 최적화 이득(LCP/lazy)이 도메인 관리 비용보다 작음

**트레이드오프**:
- ✅ 도메인 자유 추가
- ✅ 단순한 컴포넌트 코드 (인라인 disable 주석 X)
- ❌ Next 자동 최적화 미적용 (LCP/lazy load 수동 처리)

**향후 재검토**:
- 실서비스 단계 + 도메인이 5~10개로 좁혀지면 `next/image` 마이그레이션 (정해진 파트너 도메인만 사용 시점)

---

## ADR-007: 대화 히스토리는 localStorage + 커스텀 이벤트로 초기화

**상태**: Accepted

**배경**: 평가자가 새로고침해도 대화 유지되는 게 ChatGPT스러운 기본 UX. 별도 백엔드 없이 처리 필요.

**결정**:
- `localStorage` key `sosie:messages`에 `useChat`의 `messages` JSON 직렬화 저장
- 마운트 시 복원 + 변경마다 자동 저장
- 초기화는 헤더의 `ClearChatButton` (지우개 아이콘) → 확인 모달 → `window.dispatchEvent(new CustomEvent('sosie:clear-chat'))` → ChatRoot가 수신해 `setMessages([])`
- 하이드레이션 플래시 방지: `isHydrated` 플래그로 localStorage 로드 끝나기 전까지 Skeleton 표시

**이유**:
- 추가 라이브러리/백엔드 없이 가벼움
- ChatRoot ↔ Header는 페이지 트리 분리되어 있어 prop drilling보다 window 이벤트가 깔끔
- shadcn `Dialog` 이미 설치되어 있어 확인 모달 무료

**트레이드오프**:
- ✅ 백엔드 없이 영속성 확보
- ✅ Header가 ChatRoot에 직접 의존 안 함 (느슨한 결합)
- ❌ base64 이미지 포함 메시지는 localStorage 5~10MB 한도 빠르게 채움 (저장 실패 시 silent fail)
- ❌ 다중 탭 동기화 없음 (탭마다 독립 — `storage` 이벤트는 처리 안 함)
- ❌ 다중 세션(사이드바) 미지원 — V2 백로그

**향후 재검토**:
- 실서비스: Supabase 영구 저장 + 다중 세션 + 멀티 탭 sync

---

## ADR-008: ESLint `react-hooks/set-state-in-effect` 룰 끔

**상태**: Accepted

**배경**: React 19 새 lint 룰이 `useEffect` 안에서의 `setState` 호출을 차단. 그러나 외부 상태(localStorage, 마운트 검출) 동기화에는 정당한 패턴.

**결정**: `eslint.config.mjs`에 `'react-hooks/set-state-in-effect': 'off'` 추가. 인라인 disable 주석 X.

**이유**:
- 우리 코드에서 사용하는 패턴 (`localStorage` 로드 후 `setIsHydrated(true)`, `setMessages(stored)`) 모두 룰 docs가 명시한 "external system sync" 케이스
- 인라인 disable 주석 흩어지면 가독성 ↓ + 누락 위험
- 작은 코드베이스라 룰 끄는 비용보다 정당성이 큼

**트레이드오프**:
- ✅ 코드 깔끔 (주석 노이즈 없음)
- ✅ localStorage/외부 시스템 sync 패턴 자유롭게 사용
- ❌ 의도치 않은 cascading 렌더 케이스를 lint가 못 잡음 (코드 리뷰로 보완)

**향후 재검토**:
- 코드베이스 커지면 룰 다시 켜고 인라인 disable로 좁게 허용 검토
