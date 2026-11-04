# 산책핏 관리자 Windows desktop 작업 기준

## 제품과 책임

이 leaf 앱은 조사 수집함 검수·사진 편집·승인, 공개 지점·설치 기구·운동기구 도감 관리와
관리자 전용 데이터 작업을 제공하는 Tauri 기반 Windows desktop 앱이다. React·Vite 프런트엔드,
`src-tauri` Rust 경계와 로컬 Python 이미지 처리 서비스를 함께 소유한다.

관리자 승인·삭제·초기화 기능을 사용자·조사 앱이나 공통 사용자 데이터 패키지로 이동하지 않는다.
UI에서 기능을 숨기는 것으로 권한을 보장하지 않고 Supabase Auth·RLS·Storage/R2 권한을 서버 경계에서 확인한다.

## Tauri·Windows 경계

- 2026-11-04 Tauri 2 공식 문서에서 Windows 개발에 Microsoft C++ Build Tools와 WebView2가 필요하고,
  capability가 프런트엔드에 허용할 권한을 제한한다는 점을 다시 확인했다.
- 현재 capability는 `core:default`만 허용한다. 파일시스템·쉘·네트워크·업데이터 권한을 필요 확인 없이 추가하지 않는다.
- Tauri command 입력은 Rust 경계에서 검증하고 비밀키·개인 경로를 Rust 소스나 `tauri.conf.json`에 넣지 않는다.
- 프런트엔드 dev/build, `cargo check`·테스트, Tauri dev, Windows exe·MSI/NSIS 번들을 별도 단계로 검증한다.
- 번들 생성은 서명·설치·업데이트·배포 완료가 아니다. 코드 서명과 배포는 사용자 승인 후 진행한다.
- 공식 근거: [Windows 준비](https://v2.tauri.app/start/prerequisites/), [Windows installer](https://v2.tauri.app/distribute/windows-installer/), [Windows signing](https://v2.tauri.app/distribute/sign/windows/)

## Python 이미지 서비스

- 서비스는 `127.0.0.1:8765` loopback에만 바인딩하고 인터넷에 직접 노출하지 않는다.
- `.venv-images`, 모델과 테스트 결과는 생성물이므로 Git에 넣지 않고 새 경로에서 재생성한다.
- Tauri는 자신이 시작한 Python 프로세스만 종료하고 이미 실행 중인 정상 서비스를 재사용한다.
- 다른 PC의 런타임 루트는 `WALKFIT_IMAGE_ROOT`로 지정한다. 개인 PC 절대 경로를 운영 설정에 고정하지 않는다.
- 사람 감지·가림·자르기는 자동 정확도를 보장하지 않는다. 최종 이미지의 식별 가능성과 권리를 관리자가 확인한다.
- Python 환경과 모델은 현재 설치파일에 자동 번들되지 않는다. 실행파일 성공을 다른 PC 설치 완료로 표현하지 않는다.

## 데이터·사진

- Supabase DB·Auth·RLS를 권한 기준으로 사용한다. 현재 사진은 Supabase Storage를 사용하며 Cloudflare R2·Worker 전환은 별도 작업이다.
- 승인은 `admin_approve_survey_to_site` RPC로 조사 잠금·지점 생성/재사용·양방향 연결을 하나의 DB 트랜잭션에서 처리한다.
- 사진 교체는 새 업로드 → DB 경로 변경 → 참조 확인 → 미사용 이전 파일 삭제 순서를 유지한다.
- 데이터 초기화와 원격 DB·정책·버킷 변경은 사용자 명시 승인 없이는 실행하지 않는다.
- leaf의 `supabase` SQL은 기존 이력·감사용이다. 실제 운영 DB와 루트 기준 migration을 대조하기 전 실행하지 않는다.
- Supabase secret/service role, Cloudflare·R2 token과 SMTP 비밀번호를 프런트엔드·Rust·Git에 넣지 않는다.

## 실행과 검증

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 프런트엔드+이미지 서버 | `pnpm.cmd dev:fit-admin:desktop` → `http://127.0.0.1:5176` |
| 프런트엔드만 | `pnpm.cmd --filter @map-apps/fit-admin-desktop exec vite` → `http://127.0.0.1:5176` |
| 타입 검사 | `pnpm.cmd --filter @map-apps/fit-admin-desktop typecheck` |
| 단위 검사 | `pnpm.cmd --filter @map-apps/fit-admin-desktop test` |
| lint | `pnpm.cmd --filter @map-apps/fit-admin-desktop lint` |
| 웹 빌드 | `pnpm.cmd build:fit-admin:desktop` |
| Rust 검사 | `pnpm.cmd --filter @map-apps/fit-admin-desktop exec cargo check --manifest-path src-tauri/Cargo.toml` |
| Tauri 개발 | `pnpm.cmd --filter @map-apps/fit-admin-desktop tauri:dev` |
| Windows 번들 | `pnpm.cmd --filter @map-apps/fit-admin-desktop tauri:build` |
| Python 환경 생성 | 앱 폴더에서 `python -m venv .venv-images` 후 `.venv-images\Scripts\python.exe -m pip install -r image-service\requirements.txt` |
| Python 검사 | 앱 폴더에서 `.venv-images\Scripts\python.exe -m unittest discover -s image-service -p "test_*.py" -v` |
| 코드 서명 | 미구성. 인증서·서명 도구 확정과 사용자 승인 후 별도 실행 |
| 설치·업데이트·배포 | 미검증. 번들 생성 이후 별도 단계 |

환경 준비나 실제 로그인 없이 가능한 자동 검사와 관리자 로그인·실DB·사진 편집·Windows 설치 검증을 구분한다.

