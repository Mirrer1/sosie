# Sosie — AI 협업 컨텍스트

> Claude Code 등 AI 어시스턴트와 협업할 때 참조하는 컨텍스트.
> 코드 규칙 / 작업 흐름 / Phase 순서 / 환경 변수.

---

## ⚠ Next.js 16 (Turbopack) 주의

이 프로젝트는 **Next.js 16**을 사용합니다 — App Router 기반이지만 API/컨벤션/파일 구조가 14/15와 다를 수 있습니다. 코드 작성 전:

- 모호하면 `node_modules/next/dist/docs/` 또는 https://nextjs.org/docs 확인
- Tailwind는 **v4** (CSS 기반 설정, `tailwind.config.js` 없음)
- Turbopack이 기본 dev/build 엔진

---

## 현재 상태

**컨셉**: AI 패션 스타일리스트 — 사용자 프로필(스타일/브랜드/사이즈/예산) 기반으로 무신사 풀에서 골라주고, 대화 중 흘러나오는 취향은 `updateProfile` Tool로 자동 누적.

- ✅ Phase 1 셋업 (Next.js 16 + AI SDK v6 + shadcn + Tailwind v4 + Vitest)
- ✅ Phase 2 UI 베이스 (헤더 + 다크모드 + 채팅 홈)
- ✅ Phase 3 채팅 코어 (Gemini Streaming + useChat + 마크다운 + 자동 스크롤)
- ✅ Phase 4 Tool Calling — Tool 4개 완성 (`searchProducts`, `comparePrices`, `parseProductUrl`, `updateProfile`)
- ✅ Phase 5 멀티모달 + 상품 카드 (이미지 입력 3종 + 라이트박스 + ProductGrid + ToolStatus)
- ✅ Phase 6 부가 + 컨셉 피벗 (대화 히스토리 localStorage / 프로필 온보딩 + 수정 버튼 / 자동 학습 루프 / 카탈로그 폐기 / 카드 클릭 → 판매처 비교 모달)
- ⏳ Phase 7 배포 + 문서 마무리 (문서 갱신 진행 중, Vercel 배포 마무리)
- 🔧 포폴 폴리시 — 찜/북마크 기능, 가격비교 정확도 개선(모델코드·브랜드 필터), motion 등장 애니메이션, 스마트 자동 스크롤, 검색 실패/빈결과 UI, 컴포넌트 기능별 폴더 정리, 미니멀 스크롤바
- 🔧 검색 품질·UX 폴리시 — searchProducts 필터/재랭킹/동의어/가중 랜덤(ADR-014), 프로필 수정 후 옛 예산으로 검색되던 버그 fix, temperature 0.7, 답변 형식(카드와 중복되는 상품 나열 제거), 버튼 호버 툴팁·커서, 웰컴 등장 애니메이션·예시 칩 개선
- 🔧 개인화·검색 심화 — 프로필 styles 랭킹 반영, 동의어 맵 확장, 네이버 호출 병렬화, 상품명에서 브랜드 추출, 찜 브랜드 검색·랭킹 반영 + 브랜드당 개수 제한(ADR-013/014 업데이트), 프로필 변경 전 확인 카드(ADR-009 업데이트), AI 응답 중 일부 헤더 버튼 잠금
- 🔧 가격비교 폴리시 — 브랜드·구별 단어 필터(ADR-012), 모달 대표 이미지·최저가 대비 차액·최저가 보러 가기 CTA·로딩 스켈레톤·순차 등장·다시 시도·재클릭 캐시(ADR-011 업데이트)

**현재 모델**: `gemini-flash-lite-latest` (free tier 1500/day, 멀티모달, Tool Calling 모두 동작)
**검색 풀**: 네이버 쇼핑 API + 무신사 입점 도메인 필터 (카탈로그 폐기). 결과 가공(노이즈/정확도 필터·재랭킹·동의어·가중 랜덤)은 ADR-014.
**프로필**: `sosie:profile` localStorage. schema는 `src/types/profile.ts`. 옵션 상수(스타일/브랜드/사이즈/예산 프리셋) 동일 파일에서 export.

### 컨셉 피벗 이력

V1 ("닮은 옷 다 모아드려요" + 큐레이션 카탈로그 5개) → V2 ("내 취향을 닮은 옷, 같이 골라드려요" + 무신사 풀 + 프로필 루프)

작업 7단계, 모두 완료:
1. ✅ `searchProducts` Tool (네이버 쇼핑 무신사 필터) + `searchCatalog`/catalog.json 폐기
2. ✅ 온보딩 모달 + 프로필 localStorage
3. ✅ 시스템 프롬프트에 프로필 주입 + 톤 강화
4. ✅ 헤더에 프로필 수정 버튼 (`EditProfileButton` + `sosie:open-profile` event)
5. ✅ `updateProfile` Tool + 대화 중 자동 학습 루프 (`ChatRoot`의 `appliedProfileUpdates` ref)
6. ✅ 문서 갱신 (README + docs/AGENT + docs/DECISIONS + 이 파일)
7. ⏳ Vercel 배포

+ 카드 클릭 → 판매처 비교 모달 (ADR-011): `comparePrices` 핵심 로직을 `runComparePrices`로 추출해 Tool + `/api/compare-prices` 라우트가 공유. `ComparePricesDialog`는 가격 오름차순/최저가 뱃지/네이버 차단 URL 검색 페이지 우회 포함.

상세는 [`docs/DECISIONS.md`](docs/DECISIONS.md) ADR-009/010/011 참조.

---

## 협업 규칙

1. 코드 변경 전 설명하고 승인받기. 임의 결정 X.
2. 단계별로 진행. 한 번에 여러 기능 X.
3. 짧고 핵심만 설명. 장황한 설명 지양.
4. 사용자가 직접 실행할 것: 외부 계정 가입, 배포, 테스트 실행은 명령어/순서만 안내.
5. JSX return 안에 변수 선언 금지 — return 위에서 미리 계산.
6. 컴포넌트 내부 순서: 변수/state → 콜백(useCallback) → useEffect → return.
7. **return은 1개만.** 조건부 렌더링은 early return X, 단일 return 안에서 삼항 연산자 또는 `&&`로 처리.
8. 모든 컴포넌트는 **화살표 함수 + 하단 default export** 패턴.
9. 이벤트 핸들러는 기본 콜백 추출(return 위). 예외(인라인 허용): 한 줄 + 단순 setter + 재사용 없음.
10. 기본은 **서버 컴포넌트**. `"use client"`는 state/이벤트/브라우저 API 필요한 자식만 최소 단위로 분리.
11. 막히면 질문 먼저.

---

## 코드 스타일

### return 1개 패턴

❌ 나쁜 예:

```tsx
if (isLoading) return <Loading />
if (error) return <Error />
return <Content />
```

✅ 좋은 예:

```tsx
return (
  <>
    {isLoading ? <Loading /> : error ? <Error /> : <Content />}
  </>
)
```

### 컴포넌트 패턴

```tsx
const MyComponent = () => {
  return <div>...</div>
}

export default MyComponent
```

### 이벤트 핸들러

✅ 단순 setter는 인라인 OK:

```tsx
<input onChange={(e) => setName(e.target.value)} />
```

✅ 복합 로직은 추출:

```tsx
const handleSubmit = async () => {
  if (!name) return toast.error("필수")
  await save(data)
}
```

### "use client" 정책

- 기본: 서버 컴포넌트
- 조건 (셋 중 하나면 클라이언트로):
  - useState/useReducer 등 state
  - useEffect/onClick 등 이벤트
  - 브라우저 API (window, localStorage 등)
- 페이지는 서버, 인터랙션 자식만 클라이언트로 분리

### useEffect 가이드

**쓰지 말 것:**
- 데이터 fetching → useChat / 서버 라우트
- 파생 상태 계산 → 변수로 계산
- 이벤트 처리 → 이벤트 핸들러에서

**써야 할 때:**
- DOM 직접 조작 (포커스, 스크롤)
- localStorage 동기화
- 이벤트 리스너 / 타이머 등록·해제

### 메모이제이션

- 기본: 사용 안 함
- `useMemo`: 무거운 계산에만
- `useCallback`: `memo`된 자식에 함수 넘길 때만
- 성능 문제 측정 후 적용 (추측 X)

### 폼

- react-hook-form + zod
- shadcn `Form` 컴포넌트
- 로딩 → `formState.isSubmitting`

---

## 주석 스타일

| 위치 | 주석 |
| ---- | ---- |
| 인터페이스/타입 필드 | 필드 뒤 `// 한 줄` |
| 컴포넌트/유틸/콜백/useEffect | 위에 `// 한 줄` |
| state / 일반 변수 / JSX | 주석 X |

**원칙:**
- 한 문장
- 괄호 부연설명 X
- 특수문자 장식 X (`── ──`, `=` 등)
- 다른 코드 관계/비교 언급 X
- JSDoc(`/** */`) 사용 안 함

---

## 파일/폴더/컴포넌트 명명

### 파일

- 컴포넌트: `PascalCase.tsx`
- 훅: `useXxx.ts`
- 유틸/타입: `camelCase.ts`
- Next.js 특수 파일은 소문자 고정 (`page.tsx`, `layout.tsx`)

### 폴더

- 한 단어면 소문자, 합성 단어면 `camelCase`

### 컴포넌트 스코프 접두어

- 페이지/기능 종속 컴포넌트는 부모 스코프 접두어
  - 채팅: `ChatMessage`, `ChatInput`, `ChatComposer`
  - 상품: `ProductCard`, `ProductCompare`
- 공용/shadcn 컴포넌트는 접두어 X

### 컴포넌트 위치

- 기능별 폴더로 분류 → `src/components/{기능}/` (`chat`, `product`, `profile`, `layout`)
- shadcn UI → `src/components/ui/`
- 단일 페이지 앱이라 페이지 전용 `_components/`는 쓰지 않고 전부 기능별 폴더로 통합

---

## 타입 작성 위치

- 공유 타입(상품, 메시지, Tool 응답 등) → `src/types/` 도메인별
- 컴포넌트 Props / 작은 로컬 타입 → 그 컴포넌트 파일 안
- 2~3곳 이상 반복되면 → `types/`로 올려 공통화

---

## 상수 관리

- 한 파일 내 3곳 이상 사용 → 파일 상단에 대문자 변수로 분리
- 1~2곳이면 인라인 OK
- 환경별 다른 값은 `.env`
- 별도 `constants/` 폴더는 만들지 않음

---

## 작업 흐름 (커밋 단위)

**큰 틀:** 셋업 → UI 베이스 → 채팅 코어 → AI Agent + Tool → 입력 확장 → 부가 → 마감

**작은 틀 (커밋 1단위):**

1. **기능 구현**
2. **테스트 방법 안내** — Vitest 단위 또는 화면 확인 명령어
3. **화면 테스트 항목 안내** — 사용자가 확인할 리스트
4. **문제 확인** — 사용자가 결과 알림
5. **문제 있으면 수정** / **없으면 커밋명 추천**
6. 커밋 후 다음 단위

---

## 커밋 메시지 컨벤션

- 한 줄, 한글, 짧게
- prefix: `feat:` / `fix:` / `refactor:` / `chore:` / `test:` / `style:` / `docs:`
- 예: `feat: 채팅 UI 베이스 + useChat 연동`, `feat: Gemini API 라우트 + Streaming`

---

## Git 전략 (1인 프로젝트라 단순화)

- **브랜치**: `main` 하나만 사용
- 이슈/PR 없음 — 커밋 컨벤션만 깔끔하게
- 커밋 단위는 위 작업 흐름 따름

---

## Phase별 작업 순서

### Phase 1: 기반 셋업

**외부 셋업 (사용자 직접):**
- [ ] GitHub 레포 생성 (`sosie`)
- [ ] Google AI Studio Gemini API 키 발급 (https://aistudio.google.com)
- [ ] 네이버 개발자 센터 검색 API 등록 (Client ID/Secret)
- [ ] Vercel 계정 + 프로젝트 연결

**코드:**
- [ ] `npx create-next-app@latest sosie --typescript --tailwind --app --eslint --src-dir`
- [ ] Vercel AI SDK + Google provider 설치 (`ai`, `@ai-sdk/google`)
- [ ] shadcn/ui 초기화 + 컴포넌트 추가
- [ ] Prettier + Husky + lint-staged 셋업
- [ ] `.env.local` + `.env.example` + `.gitignore` (_private/ 포함)
- [ ] Pretendard 폰트
- [ ] 다크모드 (next-themes)

### Phase 2: UI 베이스

- [ ] 디자인 시스템 (모노톤 + 포인트 1색)
- [ ] 공용 컴포넌트 (Header, Footer, Container)
- [ ] 랜딩 페이지 (헤더 + 히어로 + 채팅 진입 CTA)
- [ ] 채팅 페이지 레이아웃

### Phase 3: 채팅 코어

- [ ] 채팅 메시지 UI
- [ ] 채팅 입력 컴포저 (텍스트 먼저)
- [ ] `/api/chat` Route Handler — Gemini Streaming
- [ ] `useChat` 훅 연동
- [ ] 일반 답변 작동 확인

### Phase 4: 데이터 + Tool Calling

- [ ] Zod 스키마 (`src/types/product.ts`, `src/types/tool.ts`, `src/types/profile.ts`)
- [ ] `searchProducts` Tool (네이버 쇼핑 API + 무신사 입점 필터)
- [ ] `comparePrices` Tool (네이버 API)
- [ ] `parseProductUrl` Tool (OG 파싱)
- [ ] `updateProfile` Tool (대화 중 프로필 누적)
- [ ] AI Agent에 Tool 등록 (Vercel AI SDK `tool` API)
- [ ] System Prompt 설계 (원칙 8개 + 시나리오 예시)
- [ ] Tool 응답 → 최종 답변 흐름 검증

### Phase 5: 멀티모달 + 상품 카드

- [ ] 이미지 업로드 UI
- [ ] 이미지 → base64 → Gemini (`analyzeImage` Tool)
- [ ] `ProductCard` 컴포넌트
- [ ] AI 답변 안에 카드 그리드 임베드
- [ ] Agent 사고 과정 표시 (Tool 호출 단계 streaming UI)
- [ ] URL 입력 모드 (시간 남으면)

### Phase 6: 부가 + 마감

- [ ] 대화 히스토리 localStorage 저장/복원
- [ ] (선택) 찜/북마크
- [ ] 다크모드 토글
- [ ] Framer Motion 등장 애니메이션
- [ ] 모바일/태블릿 반응형
- [ ] (선택) Vitest 핵심 로직 테스트

### Phase 7: 배포 + 문서

- [ ] Vercel 환경변수 등록
- [ ] Vercel 배포
- [ ] (선택) 도메인 연결
- [ ] README.md 마무리 (각 docs/* 링크 포함)

---

## 환경 변수 (`.env.local` 예시)

```env
# Google AI Studio (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=

# 네이버 쇼핑 API
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# (선택) 배포용
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**정책:**
- `.env.local` gitignore
- `.env.example` 키만 비워서 git에 올림 (참조용)

---

## 다른 소스 참조

- **Vercel AI SDK** (https://sdk.vercel.ai) — useChat, tool API, Streaming
- **Google AI Studio** (https://aistudio.google.com) — Gemini API 문서
- **네이버 개발자 센터** (https://developers.naver.com) — 쇼핑 검색 API
- **shadcn/ui** (https://ui.shadcn.com) — 컴포넌트
- **무신사** (https://www.musinsa.com) — 카탈로그 큐레이션 소스
- **`docs/AGENT.md`** — Agent 설계 명세 + Tool 명세 + 데이터 소스
- **`docs/DECISIONS.md`** — 주요 결정/트레이드오프 (ADR)
- **`README.md`** — 평가자용 entry, 문제 정의 포함
