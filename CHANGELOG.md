# Changelog

## v0.3.5 — 2026-10-12

AppOnFly 실행 화면에서 확인된 `Cannot read properties of undefined (reading 'create')` 오류를 수정했습니다. 원인은 Electron sandbox preload에서 외부 모듈 `qrcode`를 require해 preload 전체가 로드되지 않은 것이었습니다.

preload는 이제 Electron 내장 IPC만 사용하고, QR 생성은 main 프로세스의 IPC handler가 data URL을 반환하도록 변경했습니다. 실제 Electron 런타임에서 preload-error가 사라지고 `window.monejo`와 `window.monejo.create`가 정상 노출되는 것을 확인했습니다.

v0.3.4의 HTTPS 기본 노드, 임시 지갑 생성·복구, 기존 wallet 파일 보관 기능도 유지합니다. 공식 Monero CLI/GUI 소스의 복구 흐름인 seed 검증 → seed language 판별 → wallet generate 기준도 계속 유지합니다.

## v0.3.4 — 2026-10-12

기본 노드와 생성·복구 파일 충돌 문제를 수정했습니다.
