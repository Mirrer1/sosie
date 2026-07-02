# Sosie

옷 사고 싶은데 뭐 살지 모를 때, 취향에 맞는 옷을 같이 골라주는 **AI 패션 스타일리스트**입니다.

스타일·브랜드·사이즈·예산을 프로필로 기억해두고, 대화 중 흘러나오는 취향("사실 빈티지도 좋아해")도 알아서 누적·반영합니다. 이름 Sosie(소지)는 프랑스어로 "닮은꼴".

**Live demo:** https://sosie-theta.vercel.app

<br />

## 아키텍처

<img width="1239" height="812" alt="Image" src="https://github.com/user-attachments/assets/43046ff3-2bf3-440e-92a6-976bc5bbf09a" />

<br />
<br />

## 주요 기능

- **채팅 인터페이스** — Streaming 답변에 상품 카드를 임베드해 대화 안에서 바로 상품을 봅니다.
- **멀티모달 입력** — 텍스트와 이미지를 함께 받습니다. 이미지는 picker·드래그앤드롭·클립보드 붙여넣기로 넣고 Gemini vision으로 처리합니다.
- **다단계 Tool 호출** — 상품 검색·가격 비교·URL 파싱·프로필 업데이트 4종 Tool을 상황에 맞게 이어서 호출합니다.
- **Tool 진행 표시** — Tool 호출 단계를 실시간으로 화면에 노출합니다.
- **패션 상품 검색** — 네이버 쇼핑 검색 API로 실제 상품을 가져오고, 노이즈 제거·재랭킹·동의어 보정으로 관련도를 높입니다.
- **판매처 가격 비교** — 카드를 누르면 판매처별 가격을 모아 최저가를 표시합니다. 모델코드·브랜드 필터로 동일 상품 정확도를 높였습니다.
- **사용자 프로필** — 첫 진입 시 마법사로 스타일·브랜드·사이즈·예산을 받고, 헤더에서 언제든 수정합니다.
- **대화 중 프로필 자동 학습** — "사실 빈티지도 좋아해" 같은 발화를 프로필에 누적해 다음 추천에 반영합니다.
- **상품 찜** — 카드 하트로 저장하고 헤더 찜 목록에서 모아봅니다.
- **다국어** — 10개 언어로 UI를 전환하고, 선택 언어를 요청에 실어 AI 답변 언어까지 맞춥니다.
- **가격 현지화** — 선택 언어 통화로 근사 환산을 함께 표기합니다.
- **디테일** — 등장 애니메이션, 스마트 자동 스크롤, 검색 실패·빈결과 안내, 다크 모드

<br />

## Tool

AI가 답을 지어내지 않도록, 옷 키워드가 보이면 Tool을 호출해 실제 데이터(네이버 쇼핑)를 가져와 답합니다.

| Tool             | 입력                                    | 출력                                                             |
| ---------------- | --------------------------------------- | --------------------------------------------------------------- |
| `searchProducts` | 키워드·브랜드·가격대                    | 패션 상품 배열                                                  |
| `comparePrices`  | 상품명                                  | 판매처별 가격 (동일 로직을 `/api/compare-prices` 라우트로도 노출) |
| `parseProductUrl`| URL                                     | OG 메타 (제목·이미지·설명)                                       |
| `updateProfile`  | 변경 필드 + `mode`(merge/replace) + `reason` | 클라이언트가 받아 localStorage에 반영                       |

이미지는 별도 Tool 없이 Gemini 멀티모달 native로 처리하며, 모든 Tool 입출력은 Zod 스키마로 검증해 환각·형식 오류를 막습니다.

<br />

## 라우트

| 경로                   | 내용                            |
| ---------------------- | ------------------------------- |
| `/`                    | 채팅 홈 (단일 페이지)           |
| `/api/chat`            | Gemini + Tool Calling (max 5 step) |
| `/api/compare-prices`  | 카드 모달 판매처 가격 비교       |

<br />

## 기술 스택

| 영역        | 사용                                            |
| ----------- | ----------------------------------------------- |
| 프레임워크  | Next.js 16 (App Router, Turbopack) + React 19   |
| 언어        | TypeScript                                      |
| LLM         | Google Gemini Flash Lite (`gemini-flash-lite-latest`) |
| AI 통합     | Vercel AI SDK v6 (useChat, Tool Calling, Streaming) |
| 스키마 검증 | Zod (Tool 입출력 + 프로필·찜 schema)            |
| 상품 검색   | 네이버 쇼핑 검색 API                            |
| URL 파싱    | open-graph-scraper                              |
| 스타일      | Tailwind CSS v4 + shadcn/ui (Base UI 기반)      |
| 모션        | Motion                                          |
| 폼          | React Hook Form + Zod                           |
| 영속화      | localStorage (`sosie:profile` / `sosie:messages` / `sosie:favorites` / `sosie:language`) |
| 다크 모드   | next-themes                                     |
| 테스트      | Vitest                                          |
| 호스팅      | Vercel                                          |
| 코드 퀄리티 | ESLint + Prettier + Husky + lint-staged         |

<br />

## 설계 노트

- 프로필을 매 요청에 실어 system prompt에 주입하고, 대화에서 취향 단서가 나오면 `updateProfile` Tool로 갱신합니다. 서버는 localStorage에 접근할 수 없어 Tool은 변경 신호만 반환하고 저장은 클라이언트가 처리합니다.
- 무료 티어 모델이 Tool 호출 전에 되묻는 편이라, system prompt에 행동 원칙과 예시를 넣어 바로 검색하도록 유도했습니다.
- 가격 비교는 상품명을 그대로 검색하면 다른 모델이 섞여, 모델코드 앞부분을 기준으로 검색어를 정제하고 결과를 거릅니다. 모델코드가 없는 상품은 정상 판매처를 놓치지 않도록 보여주는 쪽으로 균형을 맞췄습니다.
- 검색 결과는 비패션·중고 노이즈를 거른 뒤 키워드·브랜드·예산 적합도로 재정렬하고, 표기 차이는 동의어로 보정하며, 0건이면 검색어를 줄여 다시 찾습니다. 상위 후보 풀에서 가중 랜덤으로 골라 매번 다르되 관련도 높은 상품이 더 자주 나오게 했습니다.

<br />

## 시작하기

요구 사항: Node.js 20+

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
# .env.local 을 만들고 각 키 값을 채웁니다 (아래 참고)

# 3. 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

<br />

### 환경 변수

- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API 키 (https://aistudio.google.com)
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — 네이버 쇼핑 검색 API (https://developers.naver.com)
- `NEXT_PUBLIC_APP_URL` — 사이트 베이스 URL (sitemap·OG에 사용)
- `GOOGLE_SITE_VERIFICATION` / `NAVER_SITE_VERIFICATION` — 검색엔진 소유권 인증 (선택)

<br />

## 스크립트

| 명령            | 설명               |
| --------------- | ------------------ |
| `npm run dev`   | 개발 서버          |
| `npm run build` | 프로덕션 빌드      |
| `npm run start` | 빌드 결과 실행     |
| `npm run lint`  | ESLint             |
| `npm run format`| Prettier 포맷      |
| `npm run test`  | Vitest 단위 테스트 |

<br />

## 프로젝트 구조

```
src/
  app/            # App Router (page / layout / api)
  components/     # 기능별 컴포넌트 (chat / product / profile / layout / ui)
  hooks/          # 커스텀 훅
  i18n/           # 다국어 리소스 (사전 / 통화 / 라벨)
  lib/            # 외부 연동 + Tool (tools/)
  providers/      # Context Provider (AppProviders)
  types/          # 공유 타입 (product / profile / tool)
  utils/          # 순수 함수
```

<br />

## 문서

| 문서                | 내용                          |
| ------------------- | ----------------------------- |
| `CLAUDE.md`         | AI 협업 컨텍스트 (코드 규칙 + 작업 순서) |
| `docs/AGENT.md`     | Agent 설계 + Tool 명세 + 데이터 소스 |
| `docs/DECISIONS.md` | 주요 결정과 트레이드오프 (ADR) |
