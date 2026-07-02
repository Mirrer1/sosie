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

## ADR-002: LLM은 Gemini Flash Lite (현재)

**상태**: Accepted (모델 변경 이력 있음)

**배경**: 어떤 Gemini 모델을 쓸지. 초기 계획은 `gemini-2.0-flash`였으나 실제 사용 중 quota/안정성 문제로 여러 번 갈아끼움.

**결정 (현재)**: **`gemini-flash-lite-latest`** (Google AI Studio free tier 1,500/day, alias라 자동으로 최신 lite 가리킴)

**모델 선택 이력**:
1. **`gemini-2.0-flash`** — 첫 시도 → 429 Quota Exceeded (`limit: 0`). 이 계정의 free tier 할당이 0이라 사용 불가
2. **`gemini-2.5-flash`** (full) — 두 번째 시도 → 동작은 하지만 free tier **하루 20회** 한도. 개발/평가 도중 빠르게 소진
3. **`gemini-2.5-flash-lite`** (hardcoded version) — 세 번째 시도 → 동작 OK
4. **`gemini-1.5-flash`** — 한 단계 다운 시도 → `404 not found for API version v1beta`. 모델 이미 deprecated
5. **`gemini-flash-lite-latest`** — 현재. alias라 모델 deprecation에 자동 대응. free tier 1,500/day, 멀티모달 + Tool Calling 모두 동작

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

## ADR-004: 데이터 소스는 네이버 쇼핑 API + 무신사 입점 필터 + OG 파싱

**상태**: Accepted (큐레이션 카탈로그에서 피벗, 이력 있음)

**배경**: 무신사 직접 크롤링은 불가능 (약관/Cloudflare). 대안 필요.

**이력**:
- **V1 (폐기)**: `src/data/catalog.json` 5개 큐레이션. "데모는 안정적이지만 상품 폭이 좁아 검색 wrapper 인상" — 한계 명확
- **V2 (현재)**: 네이버 쇼핑 API + 무신사 입점 필터로 풀 검색. 큐레이션 폐기

**결정 (현재)**:
- **검색 풀**: 네이버 쇼핑 검색 API + `link.includes('musinsa.com')` 필터로 무신사 입점만 추림
- **가격 비교**: 네이버 쇼핑 검색 API (필터 없이)
- **URL 입력**: OG 파싱
- **`mallName` 필드는 신뢰 X** — "네이버"/셀러스토어 이름이 와서 무신사 판별엔 부적합. **링크 도메인이 더 정확**
- query에 "무신사" 키워드를 강제 첨부해 검색 정확도 추가 확보 (옵션 `includeOtherMalls=true`로 비활성)

**이유**:
- **상품 폭** — 무신사 풀 전체 → "트렌드/카테고리 제한 없이" 골라줄 수 있음
- **시연 안정성** — 네이버 API는 무료 25k/day, 충분
- **자체 카탈로그 운영 부담 0** — 큐레이션 유지/확장 노력 절약
- **OG 파싱** — URL 던지면 풀 외 상품도 메타 추출 가능

**트레이드오프**:
- ✅ 무신사 풀 전체 검색 (V1 5개 한계 해소)
- ✅ 본인이 데이터 관리할 필요 없음
- ✅ 진짜 무신사 이미지/URL 사용 (카드 클릭 → 실제 페이지)
- ❌ 네이버 API 응답 메타가 빈약 (브랜드/태그/색상 등 약함)
- ❌ "광고"/잡상품 섞일 위험 → 무신사 도메인 필터 + 키워드 강제로 완화

**대안 및 기각 이유**:
- **큐레이션 유지** (V1) — 데모 안정성은 좋으나 "검색 wrapper" 한계 명확
- **무신사 직접 크롤링** — Cloudflare 차단 + 약관 위반 + 시연 중 차단 시 망함
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

---

## ADR-009: 컨셉 피벗 — 검색 wrapper → AI 패션 스타일리스트

**상태**: Accepted

**배경**: V1 컨셉("닮은 옷 다 모아드려요" + 큐레이션 카탈로그 5개)으로 1차 완성 후 다시 보니 **"단순한 AI 검색 wrapper"** 인상이 강함.

**문제 진단**:
- 큐레이션 5개라 추천 풀이 좁아 LLM이 "지능적으로 판단한다"는 인상 약함
- 사용자 컨텍스트 없이 매 대화 단발성 검색만 진행 → "에이전트"가 아닌 "검색창" 느낌
- "왜 LLM이어야 하나, 단순 검색이 더 빠른 거 아닌가" 반론 들어옴

**결정**: 컨셉 자체를 **"옷 사고 싶을 때 같이 골라주는 AI 패션 스타일리스트"** 로 피벗.

**구성 요소**:
1. **사용자 프로필** (`sosie:profile` localStorage) — 스타일/브랜드/사이즈/예산 (모두 옵션)
2. **첫 진입 시 온보딩 마법사 4단계** — 칩 토글 (`OnboardingDialog`)
3. **헤더의 프로필 수정 버튼** — 언제든 재오픈 (`EditProfileButton` + `sosie:open-profile` window event)
4. **매 요청 프로필 주입** — `useChat`의 `body` 옵션으로 클라가 보내고, 라우트에서 `formatProfile()` 한 줄 텍스트로 system prompt에 append
5. **`updateProfile` Tool** — 대화 중 사용자가 흘리는 취향 단서 감지 → AI가 호출 → 클라가 결과 받아 localStorage 머지/교체
6. **시스템 프롬프트 원칙 8개** — 프로필 활용 강제 + 자동 학습 + 답변 톤 (스타일리스트)
7. **카탈로그 폐기** — 검색 풀은 무신사 입점 풀 전체로 확장 (ADR-004 참조)

**왜 이게 "검색 wrapper" 인상을 깨는가**:
- 단발성 검색이 아니라 **사용자 컨텍스트(프로필)를 누적**해 매 검색에 곱함 → 단순 키워드 검색 대비 personalization 가시화
- **"프로필 → 검색 → 답변 → 프로필 업데이트" 닫힌 루프**가 LLM 에이전트다움을 직접 보여줌
- AI 답변이 "이거 어때요"가 아니라 **"캐주얼 좋아하시니까…"**처럼 컨텍스트를 인용 → 진짜 에이전트로 보임

**트레이드오프**:
- ✅ 검색 풀 확장 (5개 → 무신사 전체)
- ✅ 단발성 대화가 누적되어 의미 있는 컨텍스트로 진화
- ❌ 작업량 추가 (반나절+ — 프로필 schema/온보딩/Tool/system prompt/UI 전부 손)
- ❌→해소: budget을 프리셋으로 매핑하며 의도 일부 손실되던 문제는 ADR-018 슬라이더 전환으로 해결
- ❌ 자동 학습 신뢰도 한계 — 사용자 확인 단계 없이 즉시 반영 (V2 백로그)

**대안 및 기각 이유**:
- **카탈로그 30~40개로 확장만** — 여전히 "검색 wrapper" 한계. 차별성 부족
- **개인화 추천 외 다른 차별화** (예: 가상 피팅 시뮬레이션) — 작업량 과다
- **프로필을 매번 묻기** — UX 마찰 큼, "에이전트" 인상 약함

**구현 위치**:
- 프로필 schema: `src/types/profile.ts`
- 프로필 영속화: `src/utils/profile.ts`
- 온보딩 마법사: `src/components/OnboardingDialog.tsx`
- 프로필 수정 버튼: `src/components/EditProfileButton.tsx`
- Tool: `src/lib/tools/updateProfile.ts`
- 클라이언트 반영: `src/components/ChatRoot.tsx` (`appliedProfileUpdates` ref + useEffect)
- 시스템 프롬프트: `src/app/api/chat/route.ts`

**향후 재검토**:
- 자동 학습 정확도가 떨어지면 → 사용자 확인 단계 ("이거 추가할까요?") 추가
- 프로필 차원 확장 — 신체 사이즈 디테일, 색상 선호, 핏 선호, TPO 등
- implicit 학습 (클릭/찜 이력 기반)

**업데이트 — 반영 전 확인 단계 추가**:

자동 즉시 반영이 "내가 모르게 프로필이 바뀐다"는 불안을 줘서, `updateProfile` 결과를 바로 적용하지 않고 컴포저 위 확인 카드(`ProfileUpdatePrompt`)로 사용자가 [반영]/[나중에]를 고르게 변경. AI 답변도 "반영했어요" 단정 대신 "반영해둘까요?" 제안 톤. 과거 대화 복원 시엔 카드 미표시(이미 처리된 것으로 시드), updateProfile의 ToolStatus는 숨김(확인 카드와 중복·모순 방지). 구현: `ChatRoot`의 pending 큐 + `ProfileUpdatePrompt`.

---

## ADR-010: 브랜드명 "Sosie" 의미 재해석 — 닮은 옷 → 내 취향을 닮은 옷

**상태**: Accepted

**배경**: ADR-009로 컨셉 피벗 후, V1 카피("닮은 옷 다 모아드려요")가 새 컨셉("같이 골라주기")과 맞지 않음.

**옵션**:
- A. 이름 자체 변경 — 폴더/repo/package.json/문서 전부 영향
- B. 이름 유지 + 의미 재해석 — 비용 0

**결정**: B. **"Sosie = 내 취향을 닮은 옷을 골라주는 스타일리스트"** 로 의미 재해석.

**이유**:
- 어원("닮은꼴")은 살리되 그 "닮음"의 대상을 **트렌드의 닮은꼴 → 사용자 취향의 닮은꼴** 로 재맥락화
- 프로필이 곧 "나"의 거울 → 그 거울과 닮은 상품 추천 → 자연스러운 연결
- 폴더명/패키지명/URL/repo 전혀 안 건드림 → 마감 시간 보호

**적용 위치**:
- `src/app/layout.tsx` — metadata title/description
- `src/components/ChatWelcome.tsx` — 환영 화면 카피 + seed 예시 3개
- `README.md` — 한 줄 카피 + 도입부

**트레이드오프**:
- ✅ 마감 안정성 (코드 구조 영향 0)
- ✅ 어원 보존 + 새 컨셉과 자연스러운 연결
- ❌ V1 시절 코드/커밋 메시지에 옛 카피 잔재 가능 (필요시 후속 정리)

---

## ADR-011: 카드 클릭 = 판매처 비교 모달 (외부 이동이 아니라)

**상태**: Accepted

**배경**: V2 컨셉의 페인 3번("같은 상품 다른 판매처")이 채팅 흐름 안의 `comparePrices` Tool 호출만으로는 즉각 해소되지 않음 — 사용자가 명시적으로 "비교해줘" 해야 동작. 추천 카드에서 바로 비교가 보이면 페인 정렬이 더 깔끔.

**옵션**:
- A. 카드에 별도 "비교" 버튼 + 카드 클릭은 기존(외부 mall 이동) 유지 — 채팅에 메시지 자동 전송
- B. 카드 클릭 = 비교 모달 (인플레이스), 모달 안에 외부 mall 직접 진입 링크 + 원본 사이트 링크 별도

**결정**: B. 카드 클릭은 비교 모달, 모달 안 각 판매처 행이 직접 구매 링크.

**구성**:
- 핵심 로직 추출: `runComparePrices(productName)` — 기존 Tool과 새 라우트가 공유
- 신규 라우트: `POST /api/compare-prices` — 클라이언트 모달 전용
- 신규 컴포넌트: `ComparePricesDialog` — 열릴 때 fetch, 가격 오름차순 정렬, **최저가 뱃지** (2건 이상일 때), AbortController로 닫힘 시 cancel
- `ProductCard` `<a>` → `<button>` + `onClick` props 패턴
- `ProductGrid`가 선택 state + 모달 렌더 ('use client')
- 모달 하단에 작은 "원본({mall})으로 이동" 링크 — 기존 동작 보존

**왜 B인가**:
- 카드 자체가 페인 3번 진입점이 되면 "이게 가격 비교 서비스구나" 즉시 학습됨
- 모달 인플레이스 → 채팅 흐름 끊지 않음 (시선 이동 0)
- "최저가 뱃지" + 정렬로 의사결정 1초 (텍스트 답변은 스캔 필요)

**트레이드오프**:
- ✅ 페인 3번이 채팅 명시 발화 없이 1-click으로 해소
- ✅ Tool 로직과 API 라우트가 동일 함수 공유 — 중복 없음
- ✅ 카드 컴포넌트 단순화 (외부 mall 이동 책임을 모달이 가져감)
- ❌ "카드 클릭 = 상품 페이지 이동"이라는 한국 쇼핑몰 관행에서 벗어남 → 모달 하단 "원본으로 이동" 링크로 완화
- ❌ 모달 컴포넌트 + 라우트 추가 (작업 ~1h)

**서브 결정 — 네이버 차단 URL 우회**:

네이버 쇼핑 API 응답의 `link`가 `search.shopping.naver.com/catalog/...` 형태일 때 외부 referer로 직접 진입 시 "외부 이벤트를 통한 접속" 차단 페이지로 빠짐. `rel="noreferrer"`로도 IP 기반 차단까지 못 피함.

**해결**: `mapNaverResponse`에서 host 검사 후
- `shopping.naver.com` / `search.shopping.naver.com` → "{상품명} {판매처}" 쿼리의 네이버 쇼핑 검색 페이지로 우회 (`https://search.shopping.naver.com/search/all?query=...`)
- `smartstore.naver.com`, `musinsa.com`, 공식몰 등 외부 mall — 그대로 직접 이동

사용자가 네이버 검색에서 직접 진입한 형태라 차단 X. 직접 mall 페이지가 가능한 경우는 그 페이지로 바로 — 1단계 이동, 그렇지 않은 경우만 검색 페이지 경유 — 2단계.

**향후 재검토**:
- 무신사 파트너 API 도입 시 → 직접 mall URL 응답 → 검색 우회 불필요
- 모달 UX 강화 — 정렬 옵션, 가격 변동 알림, 무료배송/적립 메타 표시 (네이버 API에 메타 없음)

**업데이트 — 모달 UX 강화**:

판매처마다 다른 이미지/제목이 같은 상품을 다르게 보이게 해서, 상단에 클릭한 카드의 대표 이미지·브랜드·이름을 한 번만 보여주고 판매처 행은 "판매처 · 가격 · 최저가 대비 차액 · 구매"로 단순화. 하단은 "원본으로 이동" 대신 "최저가 N원 보러 가기" CTA(가장 싼 판매처 직접 이동)로 교체. 로딩은 쉬머 스켈레톤 위에 가운데 스피너, 결과는 위에서부터 순차 등장 애니메이션, 실패 시 "다시 시도" 버튼, 같은 상품 재클릭은 캐시 재사용(`id` 기준). 판매처 로고는 자동 판별 정확도 한계(스마트스토어 셀러가 네이버로 오인됨)로 제외.

---

## ADR-012: 가격 비교 동일 상품 정확도 — 검색어 정제 + 모델코드/브랜드 필터

**상태**: Accepted

**배경**: `comparePrices`가 상품명 그대로 네이버에 검색하니 `[브랜드]`·`(색상)`·모델코드가 검색을 방해하고, 같은 브랜드의 **다른 모델**(예: "FASTER STRONGER" vs "KWAIIIII")이 섞여 들어와 "비슷한 상품"의 정확도가 떨어짐.

**결정**: `runComparePrices` 위에 3겹 필터를 얹음.
1. **검색어 정제** (`cleanProductName`) — `[]`·`()`·모델코드 제거(브랜드명은 유지)해서 검색
2. **결과 필터** (`filterRelevantSources`) — 브랜드 일치 필수 + 모델코드 충돌 제외 + 토큰 절반 이상 겹침. 전부 걸러지면 원본 유지(빈 모달 방지)
3. **네이버 옵션** — `exclude=used:rental:cbshop`로 중고/렌탈/해외직구 제외

**핵심 인사이트**: 모델코드 앞부분(`CTCDDC004`NV → `CTCDDC004`)이 진짜 제품 식별자. 같은 코드=같은 제품(색만 다름), 다른 코드=다른 제품.

**트레이드오프**:
- ✅ 같은 브랜드 다른 모델(KWAIIIII/FEARLESS 등) 제거 → 정확도 상승
- ✅ 같은 제품·다른 판매처는 그대로 유지(가격 비교 목적 보존)
- ❌ **코드 없는 동일 브랜드 다른 모델**은 못 거름 — 네이버 역검색 구조의 구조적 한계 (자체 상품 DB/productId 매칭이 있어야 완전 해결)

**조절 손잡이**: `RELEVANCE_RATIO`(0.5), `MIN_TOKEN_MATCH`(2) — `comparePrices.ts` 상단 상수

**구현 위치**: `src/lib/tools/comparePrices.ts` (`cleanProductName`/`extractModelCodes`/`filterRelevantSources`) + 테스트 `comparePrices.test.ts`

**업데이트 — 브랜드 인자 + 구별 단어 기준**:

카드의 brand를 가격비교에 직접 전달(`runComparePrices(productName, brand)`)해 다른 브랜드 결과를 제외. 토큰 겹침 기준도 "브랜드를 뺀 구별 단어" 기준으로 바꿔, 같은 브랜드라도 흔한 단어(버튼다운/남방)만 겹치고 핵심 단어(아쿠아/스몰체크)가 안 맞는 다른 모델을 걸러냄. 단 명시적으로 요청한 브랜드는 그대로 통과(`GENERIC_BRAND_KEYS` 제외 로직). 브랜드는 상품명 앞 `[브랜드]`에서 추출하므로 정확도가 함께 올라감.

---

## ADR-013: 상품 찜/북마크 — Context + localStorage

**상태**: Accepted

**배경**: 추천 카드에서 맘에 드는 상품을 저장해 모아볼 방법이 없음. "내 취향 학습" 컨셉과도 연결되는 implicit 시그널.

**결정**: **React Context(`FavoritesProvider`) + localStorage**(`sosie:favorites`). 카드 우상단 하트 토글 + 헤더 찜 목록 모달.

**이유**:
- 헤더 개수 뱃지와 카드 하트가 **동시에 반응**해야 함 → 전역 Context가 적합 (기존 이벤트 버스보다 깔끔)
- 영속화는 프로필/대화와 동일하게 localStorage (ADR-001 일관)
- 찜 목록 모달은 `ProductGrid` 재활용 → 하트 해제 + 가격비교 자동 연동

**서브 결정 — 중첩 모달**: 찜 목록 안에서 가격비교 모달이 열리면 뒤 목록이 비쳐 지저분 → 가격비교가 열리는 동안 찜 모달 내용을 `opacity-0`로 숨김(`ProductGrid`의 `onCompareOpenChange` 콜백). 가격비교는 `body`로 포탈되므로 그대로 보임.

**트레이드오프**:
- ✅ 카드 클릭(가격비교)과 하트(찜)를 이벤트 전파 차단으로 분리
- ✅ 컴포넌트 재활용으로 찜 목록에서도 가격비교까지 동작
- ❌ localStorage 단일 기기 (ADR-001과 동일 한계)
- ❌ 찜 데이터를 아직 추천 개인화에 활용하진 않음 (implicit 학습은 백로그)

**구현 위치**: `src/components/product/` (`FavoritesProvider`/`ProductFavoriteButton`/`FavoritesButton`/`FavoritesDialog`) + `src/utils/favorites.ts` + `src/app/layout.tsx`(Provider 마운트)

**업데이트 — 찜 기반 개인화 구현**:

백로그였던 "찜을 추천에 활용"을 구현. 자주 찜한 브랜드 top N(`topFavoriteBrands`, 빈도순·"무신사"/"브랜드 미상" 제외)을 두 군데에 반영: (1) 시스템 프롬프트에 주입해 AI가 참고·언급, (2) `searchProducts`에 요청별 주입(`createSearchProducts(favoriteBrands)`)해 그 브랜드를 검색어에 추가 + 점수 가산(`FAVORITE_BRAND_SCORE`). 한 브랜드 독점을 막으려 결과 브랜드당 최대 2개(`MAX_PER_BRAND`)로 제한, 다양성이 부족하면 한도 무시하고 채움. 상품명 `[브랜드]` 추출 덕에 찜 신호가 mallName "무신사"가 아닌 실제 브랜드로 잡힘.

---

## ADR-014: searchProducts 결과 품질 — 필터·재랭킹·동의어·가중 랜덤

**상태**: Accepted

**배경**: 네이버 쇼핑 응답을 거의 날것으로 상위 N개만 잘라 반환하니 (1) 비패션·노이즈 상품이 섞이고 (2) 프로필/키워드와 덜 맞는 게 위에 오며 (3) 같은 검색이면 매번 동일한 결과만 나옴. 또 무신사 표기 차이("청바지"를 "데님"으로 표기)로 키워드 필터가 통째로 0건을 내기도 함.

**결정**: `buildOutput`에 다단계 가공을 얹고 반환을 가중 랜덤으로 전환.
1. **노이즈 필터** (`isRelevantItem`) — 비패션 카테고리 + 중고/도매 제외
2. **정확도 필터** (`matchesKeywords`) — 키워드 무관 상품 제외, 단 전부 걸러지면 카테고리 결과로 폴백(0건 방지)
3. **동의어 보정** (`expandKeywords`) — 표기 차이(청바지↔데님 등) 매핑, 모델이 빠뜨려도 매칭 유지
4. **재랭킹** (`scoreProduct`) + 중복 제거(`dedupeByName`) — 키워드·브랜드·예산 근접도로 정렬
5. **0건 완화 재시도** (`buildQueryVariants`) — 검색어가 너무 좁으면 단어를 줄여 재검색 (`display`도 20→100 확대)
6. **가중 랜덤** (`weightedSample`) — 상위 18개 풀에서 상위 우대 확률로 6개 추출

**핵심 트레이드오프 — 다양성 vs 정확도**: 균등 셔플은 다양성은 크나 하위 상품이 동일 확률로 떠 정확도가 떨어짐. 풀을 키우되(18) **상위 가중 랜덤**으로 뽑아 "매번 다르되 좋은 게 더 자주" 균형을 맞춤.

**트레이드오프**:
- ✅ 비패션·무관 상품 제거, 프로필 적합 상품 우선
- ✅ 같은 칩 반복 클릭에도 결과가 다양 (데모 인상)
- ✅ 동의어·완화로 0건 빈도 감소
- ❌ 동의어 맵은 수기 관리(주요 카테고리만) — 누락 시 모델 키워드에 의존
- ❌ 재고 적은 카테고리는 풀이 작아 다양성 제한

**조절 손잡이**: `RETURN_COUNT`(6) / `POOL_COUNT`(18) / `DISPLAY_COUNT`(100) / `KEYWORD_SYNONYMS` — `searchProducts.ts` 상단 상수

**구현 위치**: `src/lib/tools/searchProducts.ts` + 테스트 `searchProducts.test.ts`

**업데이트 — 추가 개선**:

1. **프로필 styles 반영** — 스타일을 상품명에 실제 등장하는 특징 단어로 매핑(`STYLE_KEYWORDS`, 스트릿→와이드/오버핏 등)해 검색어에 대표 단어 1개 첨부 + 점수 가산(`STYLE_SCORE`), 스타일 맞는 상품을 먼저 채움. 스타일 단어 자체는 상품명에 잘 안 나와서 "특징 단어로 번역"이 핵심.
2. **동의어 맵 확장** — 코트/패딩/셔츠·남방/원피스/슬랙스/조거 등 25개로 확장(짧아서 오매칭 위험 있는 가방·모자·신발은 제외).
3. **네이버 호출 병렬화** — 변경 쿼리들을 순차→`Promise.allSettled` 동시 호출로 지연 감소, 일부 실패는 무시하고 전부 실패만 에러. 모든 응답을 합쳐 점수·중복 제거 후 상위 풀 구성.
4. **브랜드 추출·이름 정리** — 상품명 앞 `[브랜드]`에서 브랜드를 뽑아 카드에 표시(네이버 brand 필드가 비면 mallName "무신사"로 잘못 찍히던 문제 해결), 표시 이름에선 대괄호 제거.
5. **찜 브랜드 반영 + 다양성** — 찜 브랜드 가산점 + 브랜드당 개수 제한(상세 ADR-013 업데이트).
6. **예산 소프트 필터** — 예산 하드 필터가 카테고리와 안 맞으면 결과가 통째로 비어, 예산 내가 부족하면 예산 밖도 채우되 근접도 점수로 예산 내를 우선(빈 결과 방지). 첫 대화에서 AI가 프로필 예산을 빡빡하게 적용해 1~2개만 나오던 증상 보정.
7. **간헐적 결과 부족 안정화** — 병렬 호출 일부가 일시 실패로 드랍되어 결과 수가 들쭉날쭉하던 문제를, 네이버 호출 1회 재시도 + 찜 브랜드 쿼리 1개 제한 + 결과 부족 시 넓은 쿼리 보강으로 보정.

---

## ADR-015: SEO 기본 셋업 — 파일 기반 메타데이터와 콘솔 등록

**상태**: Accepted

**배경**: 채팅 SPA라 콘텐츠 색인 가치는 낮지만, 포폴 링크 공유 인상과 기본 크롤링 위생을 위해 최소 SEO가 필요.

**결정**: Next.js 파일 기반 규약으로 구성.
- `layout.tsx` metadata에 `metadataBase`·OpenGraph·트위터 카드·검증 태그
- `opengraph-image.tsx`로 OG 이미지 코드 생성 (영문 텍스트로 한글 폰트 로딩 회피)
- `robots.ts`·`sitemap.ts` 추가
- 구글/네이버 소유권 검증은 메타 태그 방식이되 환경변수(`GOOGLE_SITE_VERIFICATION`/`NAVER_SITE_VERIFICATION`)로 주입해 코드 변경 없이 적용
- 파비콘은 `icon.png`·`apple-icon.png` (기존 기본 `favicon.ico` 제거)

**현황**: 구글 서치콘솔·네이버 서치어드바이저 소유권 확인 + `sitemap.xml` 제출 완료.

**트레이드오프**:
- ✅ 링크 공유 카드, 크롤링 위생, 검증 코드를 코드 변경 없이 교체
- ❌ SPA라 색인 페이지 수가 적음(구조적)
- ❌ OG 이미지 영문 카피 (한글은 폰트 로딩 필요)

**구현 위치**: `src/app/layout.tsx`·`opengraph-image.tsx`·`robots.ts`·`sitemap.ts`

---

## ADR-016: 다국어 — 라이브러리 없이 Context + 사전 (URL 라우팅 X)

**상태**: Accepted

**배경**: 글로벌 방문자 대응을 위해 UI와 AI 답변을 여러 언어로 제공. 방식으로 `next-intl` 같은 URL 기반 i18n 라이브러리 vs 경량 커스텀 중 선택.

**결정**: **경량 커스텀** — React Context + 언어별 사전 객체 + localStorage. 10개 언어(ko/en/ja/zh/es/fr/de/pt/ru/vi). URL 경로(`/en`)와 폴더 재구성 없이 클라이언트 토글.

**이유**:
- 단일 페이지 채팅 앱이라 URL 라우팅(`/en`)의 이점이 거의 없음 — 콘텐츠 대부분이 AI 실시간 생성이라 정적 색인 가치 낮음
- `next-intl`은 `app/[locale]/...`로 폴더를 갈아엎어야 함 → 비용 대비 실익 부족
- 기존 테마·찜 Provider 패턴과 동일해 학습 곡선 0, 의존성 0

**적용 범위**:
- **UI 전체** — 사전 키로 조회(`t(key)`). 컴포넌트는 클라이언트로 내려가지만 이 앱은 이미 채팅 전체가 클라이언트라 영향 미미
- **AI 답변** — 선택 언어를 매 요청 `body`에 실어 `formatLanguage()`로 시스템 프롬프트에 답변 언어 지시 주입
- **원문 유지** — 상품명·브랜드·판매처는 실제 커머스 데이터라 번역 제외(검색·링크·비교 정합성). 브랜드·스타일 프리셋 라벨만 표시용으로 매핑 번역(저장값은 한국어)

**타입 설계**: `{ ko: Dictionary } & Partial<Record<LanguageCode, Partial<Dictionary>>>` — ko를 완전한 원본으로 강제하고 나머지는 부분 허용, 빠진 키는 ko로 fallback. 언어를 늘리거나 키를 추가할 때 미번역이 빌드를 막지 않으면서 화면은 안 깨짐.

**서브 결정 — 프로바이더 폴더 분리**: 언어 프로바이더가 추가되며 흩어져 있던 Context 프로바이더(테마·찜·언어)를 `src/providers/`로 모으고 `AppProviders`로 조립. 도메인 종속이라도 조립 지점을 한곳으로 두어 layout 중첩을 없앰.

**트레이드오프**:
- ✅ 의존성 0, URL·폴더 구조 무변경, 기존 패턴 재사용
- ✅ fallback 구조라 부분 번역에도 안 깨짐
- ❌ 서버 컴포넌트 번역 불가(Context 기반) — 이 앱엔 실질 무해
- ❌ 언어별 SEO 없음(정적 메타는 기본 ko) — SPA라 색인 가치 낮아 수용
- ❌ 8개 언어 사전은 기계 생성이라 뉘앙스 다듬을 여지

**과거 대화 미소급**: 언어 전환 시 UI는 즉시 바뀌지만 이미 생성된 대화는 생성 시점 언어로 고정(ChatGPT·Claude와 동일). 사용자는 자기 언어로 질문하므로 실사용에선 처음부터 그 언어로 쌓임 — 재번역은 비용·품질·원문 훼손 대비 실익 없어 미도입.

**구현 위치**: `src/i18n/` (`languages`·`dictionaries`·`profileLabels`), `src/providers/LanguageProvider.tsx`, `src/components/layout/LanguageToggle.tsx`, `src/utils/language.ts`, 답변 언어 주입은 `src/app/api/chat/route.ts`의 `formatLanguage()`

---

## ADR-017: 가격 근사 환산 — 원화 기준 + 보조 표기

**상태**: Accepted

**배경**: 다국어 방문자가 "50,000원"만 보면 자국 기준으로 비싼지 싼지 감이 없음. 자국 통화 표기가 있으면 가격 직관이 생김.

**결정**: 원화를 **주(主)**로 두고 선택 언어 통화의 **근사 환산을 인라인 괄호**로 곁들임 (`50,000원 (≈ $38)`). ko는 기준 통화라 표기 생략.

**이유**:
- 실제 결제는 한국 쇼핑몰이라 **원화가 진짜 가격** — 환산가를 대체로 쓰면 "보이는 값 ≠ 결제 값"이 되어 오해
- 근사 표기는 직관만 보조하고 정합성은 원화가 지킴
- 언어≠통화지만 근사치라 언어별 대표 통화 매핑으로 충분(en→USD, ja→JPY, zh→CNY, 유럽어→EUR, ru→RUB, vi→VND)

**UI 원칙 — 할인가로 안 보이게**: 세로 스택·색상·취소선은 원가/할인가로 읽히므로 배제. 같은 줄에 `≈` 기호 + 흐린 회색(muted) + 작은 글씨 괄호로 "주석"처럼 표시.

**환율**: `open.er-api.com`(무키·무료, KRW 기준 광범위 통화) 1회 조회 후 localStorage 일 단위 캐시. API 실패 시 조용히 원화만 표시(기능 저하 없음).

**트레이드오프**:
- ✅ 자국 통화 가격 직관 제공, 결제 정합성 유지
- ✅ 무키 API + 일 캐시로 비용·지연 최소
- ❌ 환산가는 근사치(실시간 변동) — 결제 시점 값과 다를 수 있음
- ❌ 언어→통화는 대표값 매핑이라 같은 언어의 다른 국가 통화는 미반영

**구현 위치**: `src/i18n/currency.ts`(언어→통화·포맷), `src/utils/exchange.ts`(조회·캐시), `src/providers/ExchangeRateProvider.tsx`, 표시는 `ProductCard`·`ComparePricesDialog`

---

## ADR-018: 예산 입력 — 프리셋 칩에서 자유 범위 슬라이더로

**상태**: Accepted (ADR-009 budget 정책 대체)

**배경**: 온보딩 예산을 4개 프리셋 칩(5만 이하/5~15만/15~30만/30만 이상)으로만 받아, 사용자의 세밀한 범위를 담지 못하고 AI도 자유 금액을 가장 가까운 프리셋으로 올림·내림 매핑하며 의도가 일부 손실됐음.

**결정**: 프리셋 칩을 0~100만(5만 단위) **듀얼 썸 슬라이더**로 교체. 스키마(`budget: { min?, max? }`)는 이미 자유 범위라 그대로 두고 그 위의 "프리셋 관습"만 제거.

**이유**:
- 데이터·검색은 처음부터 자유 범위 기반 — 프리셋은 UI 칩 표시용 관습일 뿐이라 걷어내도 검색 품질 무변화(`searchProducts`의 `priceMin/priceMax`는 원래 자유값)
- 시스템 프롬프트 원칙 8-1을 "말한 금액 그대로 min/max"로 완화 → 예산 의도 손실 제거
- 상단 끝(100만)까지 끌면 `max` 생략으로 "이상" 저장, 하한 0은 `min` 생략

**표시**: 슬라이더 위 현재값을 금액 줄과 근사 환산 줄로 나눠 가운데 정렬 — 긴 통화 표기(일본어 등)가 옆으로 늘어지지 않게 두 줄로 분리. 근사 환산은 ADR-017 `formatApprox` 재사용.

**정리**: 프리셋 상수·라벨(`BUDGET_RANGES`, `BUDGET_LABEL_KEYS`, `budget.under5~over30` 사전 키 10개 언어) 제거, 범위 표기용 `budget.orMore`·`budget.orLess`·`onboarding.budgetAny` 추가.

**트레이드오프**:
- ✅ 사용자 의도 그대로 반영, 세밀한 범위 입력
- ✅ 스키마·검색 무변경이라 파급 최소, 기존 저장 프로필 그대로 호환
- ❌ LLM이 극단값을 담을 여지 — 검색 소프트 필터(ADR-014)가 빈 결과 방지로 보정

**구현 위치**: `src/types/profile.ts`(범위 상수), `src/utils/budget.ts`(범위 포맷), `src/components/ui/slider.tsx`, `src/components/profile/OnboardingDialog.tsx`, `ProfileUpdatePrompt.tsx`, 프롬프트는 `src/app/api/chat/route.ts`
