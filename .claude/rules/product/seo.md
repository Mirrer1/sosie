---
paths:
  - 'src/app/layout.tsx'
  - 'src/app/opengraph-image.tsx'
  - 'src/app/robots.ts'
  - 'src/app/sitemap.ts'
  - 'src/app/*icon.png'
---

# SEO와 사이트 메타 설계 결정

- 채팅 SPA라 색인 가치는 낮지만 포트폴리오 링크 공유 인상과 기본 크롤링 위생을 위해 Next.js 파일 기반 메타데이터 규약으로 최소 구성한다
- `layout.tsx` metadata에 `metadataBase`, OpenGraph, 트위터 카드, 소유권 검증 태그를 둔다. 사이트 URL은 `NEXT_PUBLIC_APP_URL`이 없으면 배포 주소로 대체한다
- 구글과 네이버 소유권 검증은 메타 태그 방식이되 `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION` 환경 변수로 주입해 코드 변경 없이 교체한다. 두 콘솔 모두 소유권 확인과 sitemap 제출을 마쳤다
- OG 이미지는 `opengraph-image.tsx`로 코드 생성하고 텍스트는 영문으로 둔다. 한글은 폰트 로딩이 필요해서다
- `robots.ts`는 전체 허용하되 `/api/`와 `/go/`는 막는다. `/go/`는 크롤러가 따라가면 직링크 조회로 SerpApi 크레딧을 소모한다
- 파비콘은 `icon.png`, `apple-icon.png` 파일 규약으로 둔다
- 제목과 설명 카피는 "내 취향을 닮은 옷, 같이 골라드려요". 이름 Sosie의 "닮은꼴"을 트렌드의 닮은꼴이 아니라 사용자 취향의 닮은꼴로 재해석해 이름을 바꾸지 않고 컨셉 피벗을 반영했다
