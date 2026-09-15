---
paths:
  - 'src/**/*.tsx'
---

# 컴포넌트 규칙

## 기본

1. 모든 컴포넌트는 **화살표 함수 + 하단 default export**
2. 내부 순서는 변수와 state → 콜백 → useEffect → return
3. **return은 1개만.** 조건부 렌더링은 early return 대신 단일 return 안에서 삼항 연산자나 `&&`로 처리한다
4. JSX return 안에서 변수를 선언하지 않는다. return 위에서 미리 계산한다
5. 이벤트 핸들러는 return 위로 추출한다. 한 줄이면서 단순 setter이고 재사용이 없을 때만 인라인을 허용한다

```tsx
// ❌ return 여러 개
if (isLoading) return <Loading />
return <Content />

// ✅ return 1개
return <>{isLoading ? <Loading /> : error ? <Error /> : <Content />}</>

// ✅ 단순 setter는 인라인
<input onChange={(e) => setName(e.target.value)} />
```

`.map()` 콜백 안에서 part 종류별로 분기해 반환하는 것은 컴포넌트 return이 아니라 허용한다.

## 서버와 클라이언트

- 기본은 서버 컴포넌트. state, 이벤트, 브라우저 API 중 하나라도 필요할 때만 `'use client'`를 붙이고 그 자식만 최소 단위로 분리한다
- 페이지(`src/app/page.tsx`)는 서버로 두고 `Header`와 `ChatRoot`처럼 인터랙션 자식만 클라이언트로 둔다

## useEffect

- 쓰지 않는 곳: 데이터 fetching(useChat이나 서버 라우트), 파생 상태 계산(변수로 계산), 이벤트 처리(핸들러에서)
- 쓰는 곳: DOM 직접 조작(포커스, 스크롤), localStorage 동기화, 이벤트 리스너와 타이머 등록 해제
- ESLint `react-hooks/set-state-in-effect`는 꺼져 있다. localStorage 복원 후 `setState`처럼 외부 시스템 동기화가 정당한 패턴이라 인라인 disable 주석이 흩어지는 것보다 룰을 끄는 쪽을 택했다. 의도치 않은 연쇄 렌더는 리뷰로 잡는다

## 메모이제이션

- 기본은 쓰지 않는다. 성능 문제를 측정한 뒤 적용한다
- `useMemo`는 무거운 계산이나 `URL.createObjectURL`처럼 매 렌더 새로 만들면 안 되는 값에만
- `useCallback`은 `memo`된 자식에 넘기거나 Context로 내려주는 함수일 때만 (예: `LanguageProvider`의 `t`, `ExchangeRateProvider`의 `formatApprox`). 소비자가 effect 의존성으로 써도 매 렌더 재실행되지 않게 하기 위함

## 이미지

외부 상품 이미지는 `next/image` 대신 `<img>`를 쓰고 `@next/next/no-img-element` 룰은 꺼져 있다. 구글 쇼핑 썸네일, 무신사, 브랜드몰 등 도메인이 계속 늘어 `remotePatterns` 관리 비용이 최적화 이득보다 크기 때문이다.

## 폼

- 입력 검증이 필요한 폼은 react-hook-form + zod + shadcn `Form`, 로딩은 `formState.isSubmitting`
- 칩 토글과 슬라이더뿐인 온보딩처럼 검증이 없는 입력은 일반 state로 둔다
