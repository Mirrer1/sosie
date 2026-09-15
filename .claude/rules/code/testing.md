---
paths:
  - 'src/**/*.test.ts'
  - 'vitest.config.ts'
---

# 테스트 규칙

- Vitest 단위 테스트만 둔다. `vitest.config.ts`가 `src/**/*.test.ts(x)`만 수집하고 환경은 `node`다. E2E는 없고 화면은 사용자가 확인한다
- 테스트 파일은 대상 파일 옆에 `대상.test.ts`로 둔다
- 순수 함수만 테스트한다. DB, SerpApi, Gemini, open-graph-scraper 호출은 테스트하지 않고, 검증할 로직을 export한 순수 함수로 분리해서 테스트한다
- `describe`는 함수 이름, `it`은 한국어로 기대 동작을 한 문장으로 쓴다
- 공용 샘플 데이터는 파일 상단 대문자 상수로 두고 케이스별 차이는 스프레드로 덮어쓴다
- 동작을 바꾸면 기존 기대값을 새 결정에 맞게 고친다. 옛 동작 테스트를 남겨두지 않는다
