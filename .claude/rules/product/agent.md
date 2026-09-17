---
paths:
  - 'src/app/api/chat/**'
  - 'src/lib/tools/**'
  - 'src/types/tool.ts'
---

# AI Agent 설계 결정

Tool 입출력 스키마의 기준은 `src/types/tool.ts`, 시스템 프롬프트 원문은 `src/app/api/chat/route.ts`다. 여기엔 왜 그렇게 만들었는지만 둔다.

## 모델

- `gemini-flash-lite-latest` + Vercel AI SDK v6 `streamText`, 다단계 Tool 호출은 `stepCountIs(5)`, `temperature` 0.7
- 고른 이유: 무료 한도가 넉넉하고 멀티모달과 Tool Calling이 둘 다 동작한다. alias라 모델 deprecation에 자동 대응한다
- 거쳐간 모델: `gemini-2.0-flash`(이 계정 무료 할당 0으로 429), `gemini-2.5-flash`(무료 하루 20회로 금방 소진), `gemini-2.5-flash-lite`(동작하나 버전 고정), `gemini-1.5-flash`(deprecated 404)
- 한계: full 모델보다 추론이 약해 가끔 내부 `tool_code`를 텍스트로 누출한다. 시연 직전에만 full 모델로 잠깐 바꾸는 선택지를 남겨둔다

## Tool 구성

| Tool              | 역할                                                    |
| ----------------- | ------------------------------------------------------- |
| `searchProducts`  | 수집 DB에서 상품 검색 (상세 `catalog.md`)               |
| `parseProductUrl` | 사용자가 준 URL의 OG 메타 추출 (`open-graph-scraper`)   |
| `updateProfile`   | 대화 중 취향 단서를 변경 신호로 반환 (상세 `profile.md`) |

- 가격 비교 Tool은 없앴다. 이유는 `catalog.md`의 "가격비교를 없앤 이유"
- 이미지 분석용 Tool은 두지 않는다. 사용자 메시지의 file part를 Gemini가 직접 보고 곧바로 `searchProducts`를 호출한다. 별도 Tool을 만들면 LLM이 두 번 호출돼 지연과 비용만 늘어난다
- `parseProductUrl`은 OG 태그 품질이 사이트마다 달라 빈 필드를 허용하고 제목이 없으면 "제목 없음"으로 채운다

## 시스템 프롬프트

Flash Lite가 Tool 호출 전에 되묻는 성향이 있어 강한 지시문 원칙 8개와 few-shot 예시로 바로 호출하게 유도한다.

1. 옷 키워드가 한 단어라도 보이면 추가 질문 없이 즉시 `searchProducts`. 기본은 무신사 상품만, "다른 데서도"류 요청에만 `includeOtherMalls: true`, "더 보여줘"는 같은 인자로 재호출. "다른 컬러도" 같은 후속 요청은 직전 품목 키워드를 유지하고, 결과에 `notice`가 있으면 답변에 반영한다. AI가 품목을 빠뜨려도 서버가 직전 품목을 붙인다(`catalog.md`의 "후속 요청의 품목 유지")
   - 1-1. 답변에 무신사, 29CM 같은 쇼핑몰 이름을 쓰지 않고 "판매처", "구매 페이지"로 말한다. 서비스가 특정 몰의 안내 페이지처럼 보이지 않게 하기 위함이고 상품 브랜드명(무신사 스탠다드)은 예외
2. 프로필의 스타일, 선호 브랜드, 예산은 서버가 자동 반영하므로 인자로 다시 넣지 않는다. 이번 요청에서 사용자가 직접 말한 조건만 인자로 넣고, 특히 `brand`에 프로필 브랜드를 넣지 않는다. 프로필이 있을 때만 실제 값에 근거해 한 줄 녹이고, 프로필이 없으면 억지로 묻지 않는다
3. 가격 비교는 지원하지 않는다고 짧게 안내하고 카드의 "구매하러 가기"로 구매 페이지에서 확인하라고 알린다
4. URL이 있으면 `parseProductUrl` 후 추출 정보로 `searchProducts`
5. 이미지가 있으면 직접 분석 후 `searchProducts`
6. Tool 결과로만 답한다. 빈 결과면 솔직히 안내하고, `outOfBudget: true`면 예산 안 상품이 적어 가까운 가격대를 함께 골랐다고 안내한다. 같은 대화 반복이 많으면(`repeatedCount`, `notice`) 새 상품인 척하지 않고 조건을 넓혀보자고 제안한다. 요청 색상이 상품명에 없으면 색상이 맞는다고 단정하지 않는다. 결과가 있으면 되묻는 질문이 아니라 추천으로 시작한다
7. 상품은 카드로 보이므로 텍스트에 상품명, 가격, 링크를 나열하지 않고 대표 1~2개의 구체적 추천 이유만 짧게
8. 취향 단서가 나오면 `updateProfile`. 반영 여부는 사용자가 확인 카드로 정하므로 "반영했어요"로 단정하지 않는다. 8-1 예산은 말한 금액을 그대로 min, max에 담는다

프로필을 AI 인자에 맡기지 않는 이유: 측정해 보니 AI가 인자를 빠뜨리면 예산 안 결과가 44%, 선호 브랜드가 0%까지 떨어졌다. `brand`는 후보 조회의 최우선 정렬 기준이라 프로필 브랜드를 넣으면 사용자가 요청하지 않은 브랜드가 후보 앞자리를 차지한다. 이전 대화의 옛 예산을 복사해 넣는 문제도 있었다.

프로필이 비어 있을 때 AI가 "평소 캐주얼한 스타일과 예산에 맞춰"처럼 없는 프로필을 지어내서, 빈 프로필이면 `formatProfile`이 "프로필 없음, 프로필 근거 언급 금지"를 명시한다. 섹션을 아예 빼면 few-shot 예시의 프로필 문장을 따라 했다.

요청마다 프롬프트 끝에 붙는 것: 프로필(`formatProfile`, 옛 인자를 복사하지 말라는 지시 포함), 찜 취향(`formatFavorites`, 찜 수와 브랜드와 스타일과 가격대, 인자로 넣지 말고 답변에서 가볍게 언급하라는 지시), 답변 언어(`formatLanguage`, 상세 `i18n.md`). 클라이언트가 매 요청 `body`에 `profile`, `favorites`(`summarizeFavorites` 결과), `language`, `seenIds`(이전에 본 상품 ID)를 싣는다. 서버는 `seenIds`와 대화 메시지의 검색 결과 ID(`collectShownIds`)를 합쳐 `createSearchProducts`의 `shownIds`로 넘기고, 대화 메시지에서 뽑은 보여준 상품 ID(`conversationShownIds`)와 직전 검색 키워드(`previousKeywords`)도 함께 넘긴다(쓰임은 `catalog.md`의 검색 14, 17번).

2026-09-17 브라우저 확인(질문 8개): 청바지, 3만원 이하 운동화, 여자 원피스, 가격 비교, 인사, 프로필 있는 자켓, 취향 추가, 다른 데서도에서 검색 호출, 성별과 예산 반영, `updateProfile` 호출, 쇼핑몰 이름 미노출이 모두 기대대로였다. 남은 편차는 가끔 "취향에 반영해둘게요"라고 단정하는 것이다.

## 환각 방어

- Tool 입력은 Zod 스키마로 강제한다
- 프롬프트에서 Tool 결과 밖의 상품, 가격, 판매처 생성을 금지한다
- 카드는 Tool 출력만 렌더링한다. 출력은 서버 Tool이 만든 값이라 클라이언트에서 다시 파싱하지 않고 타입 단언으로 쓴다
