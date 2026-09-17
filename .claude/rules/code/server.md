---
paths:
  - 'src/app/api/**'
  - 'src/app/go/**'
  - 'src/lib/**'
  - 'scripts/**'
---

# 서버 코드 규칙

## Route Handler

- `export const GET`/`POST` 화살표 함수로 쓴다. 실패는 `Response.json({ error: 메시지 }, { status })`로 돌려주고 클라이언트는 `data.error`를 그대로 표시한다
- 오래 걸리는 라우트만 `export const maxDuration`을 둔다
- Cron 라우트는 `Authorization: Bearer ${CRON_SECRET}`를 검증하고 `CRON_SECRET`이 비어 있어도 401을 돌려준다
- 동적 세그먼트 타입은 전역 `RouteContext<'/경로/[id]'>`를 쓴다

## Tool

- Tool은 `ai`의 `tool()`로 만들고 입력 스키마는 `src/types/tool.ts`의 Zod 스키마를 쓴다. LLM 입력 형식 오류를 스키마에서 막기 위함
- Tool과 API 라우트가 같은 동작을 해야 하면 핵심 로직을 `run*` 함수로 추출해 둘이 공유한다
- 요청마다 달라지는 값(프로필, 찜 브랜드)은 스키마에 넣지 않고 `create*` 팩토리로 주입한다 (`createSearchProducts`). LLM이 인자를 빠뜨려도 서버에서 확실히 반영하기 위함
- 테스트할 가공 로직은 export한 순수 함수로 분리하고 네트워크와 DB 호출은 `execute` 쪽에만 둔다

## DB

- 연결은 `src/lib/db.ts`의 `getSql()`을 요청 시점에 호출한다. 모듈 최상단에서 만들면 빌드 시점에 `DATABASE_URL`이 없어 실패한다
- 쿼리는 `sql.query(text, params)`로 파라미터를 바인딩한다. 문자열 연결로 값을 넣지 않는다
- `LIKE` 패턴에 들어가는 사용자 입력은 `%`, `_`, `\`를 제거한다
- 여러 행 쓰기는 `jsonb_to_recordset($1::jsonb)` 한 번으로 보낸다. 행마다 HTTP 요청을 보내지 않기 위함
- 스키마 기준은 `src/lib/catalog/schema.sql`, 행 타입은 `src/types/catalog.ts`. 컬럼을 바꾸면 둘을 같이 고치고 `npm run db:setup`으로 반영한다

## 외부 API

- API 키는 호출 시점에 읽고 없으면 한국어 메시지로 throw한다
- 외부 요청에는 `AbortSignal.timeout`을 둔다
- SerpApi는 무료 크레딧이 월 250회라 채팅 요청 경로에서 검색을 실시간 호출하지 않는다. 사용자 요청에서 허용되는 호출은 `/go/[id]`에서 수집 후 24시간 안 상품의 첫 클릭 직링크 조회 1회뿐이다. 토큰이 만료된 상품은 호출하지 않는다

## 스크립트

- `scripts/`는 `tsx --env-file=.env.local`로 실행하고 `@/` 경로 별칭을 그대로 쓴다. `package.json` 스크립트로 등록한다
