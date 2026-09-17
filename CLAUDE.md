# Sosie

옷 사고 싶은데 뭐 살지 모를 때 취향에 맞는 옷을 같이 골라주는 **AI 패션 스타일리스트**.

## 서비스 정체성

- 이름: **Sosie(소지)** = 프랑스어 "닮은꼴". 트렌드의 닮은꼴이 아니라 **내 취향을 닮은 옷**을 골라준다는 뜻으로 쓴다
- 한 줄 소개: "내 취향을 닮은 옷, 같이 골라드려요"
- 핵심 루프: 프로필(스타일, 브랜드, 성별, 사이즈, 예산) → 검색 → 답변 → 대화 중 취향 단서로 프로필 갱신
- 성격: 채용 지원용 포트폴리오. 방문자는 평가자 몇 명이라 첫인상(빠른 응답, 풍부한 결과)이 중요하다
- 제약: 운영비 **0원**(Vercel Hobby, Neon Free, SerpApi Free, Gemini 무료 티어), 로그인 없음, 사용자 데이터는 localStorage

## 현재 상태

라이브 배포까지 마친 단일 페이지 채팅 앱(`sosie-theta.vercel.app`). Gemini Streaming 채팅, Tool 3종(상품 검색, URL 파싱, 프로필 갱신), 이미지 입력, 온보딩 프로필과 대화 중 학습 확인 카드, 프로필과 찜 취향을 서버에서 반영하는 검색, AI 태그와 추천 이유와 비슷한 상품을 보여주는 상품 미리보기, 찜, 10개 언어와 가격 근사 환산, 다크 모드, SEO가 동작한다. 네이버 쇼핑 검색 API가 2026-07-31에 종료되어 상품 데이터는 SerpApi 구글 쇼핑을 매일 수집해 Gemini로 태깅한 Neon DB에서 검색한다. 검색은 기본 무신사, 요청 시 검색 주소를 확인한 지원 판매처 12곳까지 넓히고, 이전에 본 상품은 대화를 지워도 뒤로 보내 매번 다른 상품을 보여준다. 구매 링크는 상품 판매처로 가며 상품 페이지를 모르면 그 판매처 검색 결과로 보낸다. 같은 상품이 여러 판매처에서 거의 수집되지 않아 가격비교 기능은 없앴다.

## 문서 안내

문서는 전부 `.claude/` 안에 있다.

| 위치                     | 내용                                     | 읽히는 시점              |
| ------------------------ | ---------------------------------------- | ------------------------ |
| `CLAUDE.md` (이 파일)    | 정체성, 현황, URL, 명령어, 기술 스택     | 항상                     |
| `.claude/rules/code/`    | 코드 작성 규칙 (어떻게 짜나)             | 해당 파일을 다룰 때 자동 |
| `.claude/rules/product/` | 영역별 설계 결정 (무엇을 왜 만들었나)    | 해당 파일을 다룰 때 자동 |
| `.claude/history.md`     | 만든 순서대로의 작업 이력                | 필요할 때 직접 찾아봄    |
| `.claude/skills/`        | `/update-docs` 작업 후 문서 갱신         | 호출할 때                |

규칙 파일과 적용 범위:

| 파일                  | 적용 범위                                           | 내용                                             |
| --------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `code/general.md`     | 항상                                                | Next 16 주의, 협업 방식, 주석, 명명, 위치, 커밋  |
| `code/components.md`  | `*.tsx`                                             | 컴포넌트 구조, use client, useEffect, 이미지, 폼 |
| `code/server.md`      | api, go 라우트, lib, scripts                        | Route Handler, Tool, DB 쿼리, 외부 API           |
| `code/testing.md`     | `*.test.ts`, vitest 설정                            | Vitest 범위와 작성 방식                          |
| `product/agent.md`    | chat 라우트, tools, tool 타입                       | 모델, Tool 구성, 시스템 프롬프트 원칙            |
| `product/catalog.md`  | catalog, db, 검색 Tool, cron, go, scripts           | 데이터 소스, 수집, 검색 품질, 구매 링크          |
| `product/profile.md`  | profile 컴포넌트, 프로필 타입과 유틸, updateProfile | 프로필 루프, 온보딩, 예산, 학습 확인             |
| `product/shopping.md` | product 컴포넌트, 찜과 추천 이유 유틸, 비슷한 상품  | 상품 미리보기, 찜 취향 신호                      |
| `product/chat.md`     | chat, layout 컴포넌트, hooks, page                  | localStorage 저장, 헤더 이벤트, 입력, 표시       |
| `product/i18n.md`     | i18n, 언어와 환율 프로바이더와 유틸                 | 다국어 방식, 가격 근사 환산                      |
| `product/seo.md`      | layout, OG 이미지, robots, sitemap, 아이콘          | 메타데이터, 소유권 검증, 카피                    |

작업을 마치면 `/update-docs` 스킬로 이력과 규칙을 갱신한다. 기존 기능을 고치기 전엔 `.claude/history.md`에서 해당 항목을 먼저 찾아본다.

## URL 구조

| URL                   | 내용                                        |
| --------------------- | ------------------------------------------- |
| `/`                   | 채팅 홈 (단일 페이지)                       |
| `/api/chat`           | Gemini Streaming + Tool Calling             |
| `/api/cron/collect`   | 매일 상품 수집 (Vercel Cron, 03시 KST)      |
| `/api/products/[id]/similar` | 상품 미리보기의 비슷한 상품           |
| `/go/[id]`            | 판매처 상품 페이지나 판매처 검색으로 302 이동 |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image` | SEO 파일 규약 |

## 자주 쓰는 명령어

```bash
npm run dev                     # 개발 서버
npm test                        # Vitest 단위 테스트
npm run lint                    # ESLint
npm run build                   # 프로덕션 빌드 (타입 검사 포함)
npm run db:setup                # DB 테이블과 인덱스 생성
npm run db:seed -- --limit=10   # 오래된 검색어부터 상품 수집 (SerpApi 크레딧 소모)
```

## 기술 스택

| 영역        | 선택                                                          |
| ----------- | ------------------------------------------------------------- |
| 프레임워크  | Next.js 16 (App Router, Turbopack) + React 19                 |
| 언어        | TypeScript                                                    |
| LLM         | Gemini Flash Lite (`gemini-flash-lite-latest`)                |
| AI 통합     | Vercel AI SDK v6 (useChat, Tool Calling, Streaming)           |
| 상품 데이터 | SerpApi 구글 쇼핑 수집 + Gemini 태깅 + Neon Postgres(pg_trgm) |
| 스케줄러    | Vercel Cron                                                   |
| 스키마 검증 | Zod                                                           |
| 스타일      | Tailwind CSS v4 + shadcn/ui (Base UI 기반)                    |
| 모션        | Motion (`motion` 패키지)                                      |
| 다크 모드   | next-themes                                                   |
| 테스트      | Vitest                                                        |
| 호스팅      | Vercel                                                        |
| 코드 퀄리티 | ESLint + Prettier + Husky + lint-staged                       |
