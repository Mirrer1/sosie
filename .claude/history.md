# Sosie 작업 이력 (HISTORY)

> 만든 순서대로의 작업 이력. 옛 CLAUDE.md의 현재 상태, 컨셉 피벗 이력, Phase별 작업 순서를 원문 그대로 옮겼다. 자동으로 읽히지 않는 참고 문서라 기존 기능을 고치기 전에 해당 항목을 찾아본다. 본문의 ADR 번호는 삭제된 docs/DECISIONS.md 기준이고 현재 설계 결정은 `rules/product/`에 있다. 새 항목은 맨 뒤에 쌓는다.

## 현재 상태 (원문)

**컨셉**: AI 패션 스타일리스트 — 사용자 프로필(스타일/브랜드/사이즈/예산) 기반으로 무신사 풀에서 골라주고, 대화 중 흘러나오는 취향은 `updateProfile` Tool로 자동 누적.

- ✅ Phase 1 셋업 (Next.js 16 + AI SDK v6 + shadcn + Tailwind v4 + Vitest)
- ✅ Phase 2 UI 베이스 (헤더 + 다크모드 + 채팅 홈)
- ✅ Phase 3 채팅 코어 (Gemini Streaming + useChat + 마크다운 + 자동 스크롤)
- ✅ Phase 4 Tool Calling — Tool 4개 완성 (`searchProducts`, `comparePrices`, `parseProductUrl`, `updateProfile`)
- ✅ Phase 5 멀티모달 + 상품 카드 (이미지 입력 3종 + 라이트박스 + ProductGrid + ToolStatus)
- ✅ Phase 6 부가 + 컨셉 피벗 (대화 히스토리 localStorage / 프로필 온보딩 + 수정 버튼 / 자동 학습 루프 / 카탈로그 폐기 / 카드 클릭 → 판매처 비교 모달)
- ⏳ Phase 7 배포 + 문서 마무리 (Vercel 배포됨 https://sosie-theta.vercel.app, SEO·콘솔 등록 완료, 문서 마무리 중)
- 🔧 포폴 폴리시 — 찜/북마크 기능, 가격비교 정확도 개선(모델코드·브랜드 필터), motion 등장 애니메이션, 스마트 자동 스크롤, 검색 실패/빈결과 UI, 컴포넌트 기능별 폴더 정리, 미니멀 스크롤바
- 🔧 검색 품질·UX 폴리시 — searchProducts 필터/재랭킹/동의어/가중 랜덤(ADR-014), 프로필 수정 후 옛 예산으로 검색되던 버그 fix, temperature 0.7, 답변 형식(카드와 중복되는 상품 나열 제거), 버튼 호버 툴팁·커서, 웰컴 등장 애니메이션·예시 칩 개선
- 🔧 개인화·검색 심화 — 프로필 styles 랭킹 반영, 동의어 맵 확장, 네이버 호출 병렬화, 상품명에서 브랜드 추출, 찜 브랜드 검색·랭킹 반영 + 브랜드당 개수 제한(ADR-013/014 업데이트), 프로필 변경 전 확인 카드(ADR-009 업데이트), AI 응답 중 일부 헤더 버튼 잠금
- 🔧 가격비교 폴리시 — 브랜드·구별 단어 필터(ADR-012), 모달 대표 이미지·최저가 대비 차액·최저가 보러 가기 CTA·로딩 쉬머·가운데 스피너·순차 등장·다시 시도·재클릭 캐시(ADR-011 업데이트)
- 🔧 검색 안정화·SEO — 예산 소프트 필터(빈 결과 방지)·네이버 호출 재시도·결과 부족 시 보강(ADR-014 업데이트), SEO 메타데이터·OG 이미지·robots·sitemap·콘솔 검증(ADR-015), 파비콘, 주석/커밋 컨벤션 정리
- 🔧 다국어·가격 현지화 — 경량 커스텀 i18n(Context + 언어별 사전 + localStorage) 10개 언어로 UI 전환, 선택 언어를 매 요청에 실어 AI 답변 언어까지 반영, 프로바이더 폴더 분리, 가격 근사 환산 표기(ADR-016/017)
- 🔧 예산·프로필 옵션 폴리시 — 예산 프리셋 칩을 0~100만 슬라이더로 전환하고 원칙 8-1을 자유 범위로 완화, 예산 표시를 금액과 근사 환산 두 줄로 분리(ADR-018), 기본 스타일에 클래식·고프코어 추가하고 포멀·나이키 제외
- 🔧 데이터 소스 교체 — 네이버 쇼핑 검색 API 종료(2026-07-31)로 SerpApi 구글 쇼핑 매일 수집 + Gemini 태깅 + Neon Postgres DB 검색으로 전환, `/go/[id]` 직링크 지연 확보, 가격비교는 DB 판매처 매칭(ADR-019)

**현재 모델**: `gemini-flash-lite-latest` (free tier 1500/day, 멀티모달, Tool Calling 모두 동작)
**검색 풀**: Neon Postgres `products` 테이블. Vercel Cron이 매일 SerpApi 구글 쇼핑에서 무신사와 신뢰 판매처 상품을 수집하고 Gemini로 태깅(`src/lib/catalog/`). 결과 가공(재랭킹·동의어·가중 랜덤)은 ADR-014, 수집 구조와 대안 검토는 ADR-019.
> ⚠ **네이버 쇼핑 검색 API는 2026-07-31 종료됨** (약관 부칙 제2조 ③항, NAVER API HUB 미이관). 무신사와 네이버 쇼핑은 크롤링 금지라 직접 수집 X. SerpApi 무료 크레딧은 월 250회라 실시간 호출 추가 금지.
**프로필**: `sosie:profile` localStorage. schema는 `src/types/profile.ts`. 옵션 상수(스타일/브랜드/사이즈 프리셋, 예산 슬라이더 범위) 동일 파일에서 export.

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

## Phase별 작업 순서 (원문)

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

## 이후 작업

**문서 구조를 Claude Code 표준으로 이전.** CLAUDE.md(현황, 작업 이력, 코드 규칙), docs/AGENT.md(Agent와 Tool 명세), docs/DECISIONS.md(ADR 19개)를 `CLAUDE.md`(정체성, 현황, URL, 명령어, 스택) + `.claude/rules/code/`(general, components, server, testing) + `.claude/rules/product/`(agent, catalog, profile, shopping, chat, i18n, seo) + `.claude/history.md` + `.claude/skills/update-docs`로 나눴다. 규칙 파일은 `paths`로 해당 파일을 다룰 때만 읽혀 매 대화 컨텍스트를 줄이고, 옮기면서 문서를 실제 코드와 대조해 틀린 경로와 설명을 고쳤다. 곁가지: `.claude/settings.json`에 테스트, 린트, git 조회 허용과 force push, hard reset, env 파일 읽기 차단, `.worktreeinclude`에 `.env.local`.

**가격비교 제거와 카드 직링크.** 무신사 상품 150개 샘플로 가격비교를 돌려보니 전부 판매처가 1곳이라, 가격비교 모달(`ComparePricesDialog`)과 `/api/compare-prices`, `comparePrices` Tool을 삭제하고 카드를 `<a target="_blank">`로 바꿔 누르면 `/go/[id]`로 판매처 상품 페이지가 바로 열리게 했다. 가격 비교를 물으면 AI가 지원하지 않는다고 안내한다. 찜 하트는 링크 위에 겹쳐 `preventDefault`로 분리. 구글 쇼핑은 검색어당 40개만 주고 한국 결과에 판매처 묶음이 없어 같은 상품이 여러 몰에서 함께 수집되지 않는 구조라 수집을 늘려도 해결되지 않는다고 판단했다.

**프로필을 서버에서 검색에 반영.** AI가 프로필 인자를 빠뜨리면 예산 안 결과가 44%, 선호 브랜드가 0%라서, 클라이언트가 보내는 프로필을 `createSearchProducts({ profile, favoriteBrands })`로 주입하고 `resolveSearchInput`이 생략된 스타일과 예산을 채우도록 했다. 프로필 선호 브랜드와 찜 브랜드는 `buildPreferredBrands`로 합쳐 가산점에 쓰고, `brand` 인자는 이번 요청에서 사용자가 직접 말한 브랜드만 넣도록 프롬프트와 스키마 설명을 바꿨다. 검색어의 "남자", "여자"는 태그 성별 필터로 옮기고, 후보 조회 정렬에 예산 안 여부를 넣어 개수 제한에 잘리지 않게 했다. 측정 결과 인자를 빠뜨려도 예산과 스타일 일치 100%, 성별 일치 100%. 곁가지: 수집 검색어의 브랜드를 "무신사 + 브랜드"로 바꾸고 "무신사 + 스타일 + 품목" 27개를 추가해 프로필에 맞는 상품 풀을 보강.

**찜 취향 신호와 상품 미리보기.** 찜 반영이 브랜드 상위 3개뿐이던 것을 `summarizeFavorites`로 브랜드, 두 번 이상 나온 스타일 상위 2개, 찜 가격의 하위 25%~상위 25% 가격대까지 요약해 매 요청 `favorites`로 싣게 했다. 서버는 `buildPreferences`로 프로필 브랜드와 합쳐 가산점에 쓰고, 요청과 프로필 스타일이 없으면 찜 스타일을 우선 채울 스타일로(`pickStyles`), 예산이 없으면 찜 가격대를 가산점으로 쓴다. 프롬프트는 `formatFavorites`로 찜 취향을 전달한다. 측정 결과 찜만 있을 때 반팔티 빈티지 비율 12% → 95%, 셔츠 찜 가격대 비율 30% → 93%. 카드 클릭은 판매처 직행에서 `ProductPreviewDialog`로 바꿔 AI 태그, `buildMatchReasons` 추천 이유, 구매 링크, 찜 토글, "이런 스타일 더 찾아줘"(`sosie:ask` 이벤트로 채팅 전송), `/api/products/[id]/similar` 비슷한 상품 8개를 보여준다. 판매처로 바로 보내면 AI 태깅과 개인화가 화면에 드러나지 않았기 때문이다. 곁가지: 상품 응답에 세부 품목, 성별, 색상, 소재 태그를 포함(`rowToMarketProduct`), 미리보기 문구 14개를 10개 언어에 추가, 초기 수집 완료(상품 2,533개, 무신사 1,604개).

**추천 이유 즉시 반영과 프로필 성별.** 찜 하나만 해도 신호가 잡히도록 찜이 2개 이하면 한 번 나온 스타일도 쓰고 찜이 하나면 그 가격 앞뒤 30%를 가격대로 잡았다(`topFavoriteStyles`, `favoritePriceRange`). 미리보기는 프로필을 렌더할 때마다 바로 읽고 보고 있는 상품은 찜 신호에서 빼며, 예산이 없을 때 "찜한 상품과 비슷한 가격대" 이유를 추가했다. 프로필에 성별(남성, 여성, 비우면 전체)을 넣고 온보딩 3단계를 "성별과 사이즈"로 묶었다. 검색은 검색어 성별이 없으면 프로필 성별로 반대 성별을 빼고 정확히 같은 성별을 가산점으로 앞세우며(반팔티 기준 남성 설정 시 남성 100%), `updateProfile`은 "전체"로 성별 설정을 해제한다. 곁가지: 구매 버튼 문구를 판매처명 대신 "구매하러 가기"로 통일, 미리보기를 모든 영역 높이 고정으로 바꿔 스크롤과 크기 변화 제거.

**추천 이유 우선순위와 근거 링크.** 프로필에 성별이나 사이즈만 있으면 프로필 이유가 하나도 안 나와 찜 이유만 보이던 문제를, 프로필 성별과 정확히 같은 성별 상품 이유를 추가하고 `buildMatchReasons`를 프로필 이유(스타일, 예산, 브랜드, 성별) 먼저, 찜 이유 다음 순으로 최대 3개 채우도록 나눠 해결했다. 프로필과 겹치는 찜 이유는 중복 표시하지 않는다. 이유가 많아도 모달 크기 고정 원칙에 따라 칸 스크롤이나 모달 확장 대신 상위 3개만 보여준다. 이유 문장의 근거 부분은 사전의 대괄호 구간으로 표시해 링크로 만들고(`splitReasonText`), 프로필 이유는 마법사를 해당 단계로(`initialStep`), 찜 이유는 근거 찜 상품만 모은 모달(`ProductReasonFavoritesDialog`, `favoritesForReason`)을 미리보기 위에 중첩으로 띄운다. 곁가지: 마법사 저장 시 `sosie:profile-changed` 이벤트로 채팅 프로필 상태 갱신, 근거 찜 상품을 누르면 미리보기를 그 상품으로 전환, 중첩 모달 뒤 배경 흐림이 빠지던 문제를 `DialogOverlay`의 `forceRender` 기본 true로 해결.

**판매처별 구매 링크와 추천 다양화.** 배포 사이트에서 "구매하러 가기"를 누르면 대부분 구글 쇼핑의 "찾을 수 없음"이 떴다. 원인은 판매처 조회 토큰과 구글 쇼핑 상품 페이지가 하루이틀이면 만료되는 것이었다(이틀 전 토큰은 판매처 목록이 빈 값). `resolveProductUrl`을 저장된 판매처 도메인 직링크, 수집 후 24시간 안이면 SerpApi 조회(`isTokenFresh`, `pickStoreLink`), 그 외엔 그 판매처 사이트 검색(`buildMallSearchUrl`, `buildSearchKeyword`) 순으로 바꿨다. 판매처 검색으로 보내려면 검색 주소를 알아야 해서 `malls.ts`의 `SUPPORTED_MALLS` 12곳(검색 주소를 직접 확인한 곳)만 수집, 검색, 비슷한 상품에 쓰고 AI 신뢰 판매처 판단(`mallTrusted`)과 후루츠패밀리 같은 소규모와 중고 몰은 뺐다. 네이버 쇼핑 검색 대체, 무신사 전용 전환, Gemini Google Search grounding(무료 할당 0)은 검토 후 기각했다. 추천 반복도 줄였다. 프로필이 있으면 같은 검색 10번에 서로 다른 상품이 16개뿐이라 풀을 18개에서 30개로 넓히고, 본 상품 ID를 localStorage `sosie:seen-products`에 최근 300개 저장해 매 요청 `seenIds`로 보내 풀 뒤로 보낸다(`src/utils/seenProducts.ts`). 본 상품을 완전히 빼면 선호 상품이 적은 품목에서 빈티지 비율이 85% → 15%로 떨어져서 `pickProducts`가 선호 스타일과 선호 브랜드 새 상품, 이미 본 선호 상품 최대 2개, 나머지 순으로 채우게 했다(빈티지 27%, 커버낫 6% → 17%). "다른 데서도"는 `pickWithOtherMalls`로 최대 3자리를 무신사 외 상품에 배정한다. 답변 품질은 Playwright로 질문 8개를 확인하고 빈 프로필을 지어내던 문제(`formatProfile` 빈 프로필 안내), 예산 밖 카드를 보여주며 "결과 없음"이라 답하던 문제(`outOfBudget`), 답변에 쇼핑몰 이름이 나오던 문제(원칙 1-1)를 고쳤다. 곁가지: 0건이던 "무신사 + 스타일 + 품목" 검색어 23개를 "무신사 + 스타일"로 바꾸고 지원 판매처 검색어 10개 추가, `STYLE_KEYWORDS`에 클래식과 고프코어 추가, 29CM 검색 주소가 `/store/search`로 바뀐 것 반영, Node 22.11에서 Vitest 설정 로드가 실패해 Node 22.12 이상으로 명시.

**상품 상세 링크와 후속 요청 검색.** 구매 링크가 대부분 판매처 검색 결과로 가서, 첫 클릭 때 SerpApi 구글 웹검색(`searchGoogleWeb`, `site:판매처 브랜드 상품명`)으로 상품 상세 페이지를 찾아 `direct_url`에 저장하도록 바꿨다. 시험에서 10개 중 9개를 찾았다. 실제 클릭에서 같은 브랜드 다른 상품(Pride Prove), 다른 색상(Nori-White), 추천 목록 페이지로 가는 문제가 나와 `scoreProductTitle`에 절반 이상 일치, 제목 2점과 요약 1점 가중, 모델명 필수, 다른 영문 이름 제외를 넣고 `productPath`로 상품 상세 경로만 받게 했다. 긴 검색어에서 구글이 사이트 제한을 무시하면 짧은 검색어로 한 번 더 찾고 제한 시간은 15초로 늘렸다. Tavily(해외 색인), NAVER API HUB(AI 입력과 저장 금지 약관), Gemini grounding(무료 할당 0)은 기각했다. 검색은 "5만원대 반바지 → 비비드한 컬러로 → 다른컬러도 → 다른데서도" 흐름을 고쳤다. 색상 표현을 가산점 색상으로 바꾸고(`extractColorIntent`), 색상뿐인 후속 요청에 직전 품목을 붙이고(`withPreviousItemKeywords`), 같은 대화 반복이 3개 이상이면 `notice`로 안내를 강제하고, 작은 풀에서 5개만 나오던 문제를 채웠다. 곁가지: 크레딧 부족으로 매일 수집을 4회에서 2회로 줄임, SerpApi 계정 카드 미등록 확인, 잘못 저장된 직링크 3건 정리, 한국어 색상 동의어 추가.
