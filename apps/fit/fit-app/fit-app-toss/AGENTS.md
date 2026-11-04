# 산책핏 사용자 토스 미니앱 작업 기준

## 제품과 플랫폼 경계

이 leaf 앱은 공개 실외 운동기구 지점·설치 기구 정보를 Apps in Toss에서 제공한다. React 18,
Apps in Toss Web Framework·Devtools, TDS Mobile/AIT, OpenLayers와 Vite 설정을 독립 소유한다.
사용자 PWA의 UI·라우팅·환경 파일을 import하지 않고 `@map-apps/contracts`, `@map-apps/data`의
공개 export만 공유한다.

현재 `appName`은 `walk-fit-map`이며 기존 콘솔 등록값과 일치하는지 업로드 전에 다시 확인한다.
위치 권한은 `apps-in-toss.config.ts`의 `geolocation` 선언과 실제 토스 기기 동작을 함께 검증한다.

## 공식 기준과 확인일

- 2026-11-04에 Apps in Toss 공식 개발자센터의 서비스 오픈 정책, 비게임 체크리스트, SDK 3.x,
  테스트·번들 업로드 문서가 현재도 별도 단계임을 확인했다.
- 현재 설치 버전은 정본의 SDK 3.8.1, TDS 2.5.1, React 18.3.1을 유지한다.
- 이전 완료를 최신 SDK 호환성·콘솔 검수·실기기 검증 완료로 간주하지 않는다. 기능 변경이나 업로드 전
  [공식 개발자센터](https://developers-apps-in-toss.toss.im/)의 최신 정책과 설치 버전을 다시 확인한다.
- `.ait` 생성, 콘솔 테스트 업로드, 공개 검토 요청과 출시는 각각 별도 단계이며 업로드부터 사용자 명시 승인이 필요하다.

## 데이터·광고·개인정보

- Supabase DB·Auth·RLS를 데이터 권한 기준으로 사용하고 공개 지점·기구 조회만 허용한다.
- 사진 바이너리는 비공개 Cloudflare R2에 두고 공개 지점·설치 기구 여부를 확인하는 Worker URL로 조회한다. Supabase Storage를 사용하지 않는다.
- 광고 모드는 기본 `off`다. `test`는 공식 테스트 ID만, `production`은 승인된 운영 그룹 ID만 사용한다.
- 배너·전면 광고 실패가 시설 상세 이동을 막지 않게 하며 실제 토스 광고 검증을 브라우저 대체 검사로 주장하지 않는다.
- 기구 조회 통계는 선택 동의·연령대·시도·일별 집계·90일 보관 조건과 DB/RLS 검증 전 활성화하지 않는다.
- 토스 로그인·보상형 광고·결제는 현재 범위가 아니다. 필요를 확정하기 전에 SDK나 서버 기능을 추가하지 않는다.
- Supabase secret, R2·Cloudflare token, 광고 운영 자격 증명과 AIT 업로드 키를 소스·환경 예제·로그에 넣지 않는다.

## 실행과 검증

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 개발 서버 | `pnpm.cmd dev:fit-app:toss` → `http://127.0.0.1:5174/home` |
| 타입 검사 | `pnpm.cmd --filter @map-apps/fit-app-toss typecheck` |
| 단위 검사 | `pnpm.cmd --filter @map-apps/fit-app-toss test` |
| lint | `pnpm.cmd --filter @map-apps/fit-app-toss lint` |
| 브라우저 E2E | `pnpm.cmd --filter @map-apps/fit-app-toss test:e2e` |
| 웹·AIT 번들 생성 | `pnpm.cmd build:fit-app:toss` |
| AIT 결과 | `apps/fit/fit-app/fit-app-toss/walk-fit-map.ait` |
| 콘솔 토큰 등록 | 앱 폴더에서 `pnpm.cmd exec ait token add walk-fit-map`; 사용자 승인과 대화형 입력 필요 |
| 테스트 업로드 | 앱 폴더에서 `pnpm.cmd exec ait deploy --profile <프로필> --location ./walk-fit-map.ait -m "<변경 내용>"`; 사용자 승인 필요 |
| 공개 검토·출시 | 콘솔에서 별도 사용자 승인 후 진행 |

브라우저·대체 SDK 검사는 실제 토스 권한·Safe Area·뒤로가기·광고·기기 저장소를 대신하지 않는다.
번들 성공과 업로드·검토·출시 성공을 구분해 `progress.md`에 기록한다.

