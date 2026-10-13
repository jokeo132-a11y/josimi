## v0.3.8 — 2026-10-13

첫 화면을 실제 지갑 앱처럼 단순화했습니다.

- `내 키는 내 기기에` 같은 마케팅형 문구 제거
- 대형 히어로 영역 제거
- `MAINNET` 배지 제거
- 화면에 노출되는 불필요한 mainnet 문구 제거
- 브랜드, 지갑 제목, 열기·새 지갑·복구 탭과 입력 폼에 집중
- 네트워크는 내부 기능으로 유지하며 UI에서는 노드 정보만 표시

## v0.3.7 — 2026-10-13

Monero GUI와 Cake Wallet의 실제 제품 화면을 참고해 인터페이스를 정리했습니다.

- 큰 히어로 문구와 장식적인 radial gradient를 제거했습니다.
- Monero GUI처럼 정보 밀도가 있는 charcoal surface, orange accent, compact navigation을 사용합니다.
- Cake Wallet처럼 버튼·입력·잔액·주소·송금 흐름의 우선순위를 명확히 했습니다.
- 카드 모서리, 간격, 테두리, hover/focus 상태를 일관되게 맞췄습니다.
- 모바일 화면에서도 송금·주소·거래내역 카드가 자연스럽게 쌓입니다.

## v0.3.6 — 2026-10-13

복구 주소 불일치 점검 및 Monero 공식 GUI/CLI 흐름 대조 버전입니다.

- monero-ts 공식 설정명인 `server`를 사용하도록 수정했습니다. 이전의 `serverUri`는 daemon 연결 설정으로 적용되지 않았습니다.
- 공식 GUI/CLI에 있는 seed offset passphrase 입력을 복구 화면에 추가했습니다. offset을 사용하면 다른 주소가 나오는 것이 정상입니다.
- Monero 표준 seed 형식인 13/14/25단어만 허용하고 잘못된 12/24단어 입력은 거부합니다.
- 생성된 지갑과 복구된 지갑의 primary address를 파일 저장 전후로 비교해 주소가 바뀌면 실패 처리합니다.
- 실제 monero-ts 재현에서 같은 25단어 seed는 같은 주소를 만들고, offset passphrase를 넣은 경우에만 다른 주소가 만들어지는 것을 확인했습니다.

# Changelog

## v0.3.5 — 2026-10-12

AppOnFly 실행 화면에서 확인된 `Cannot read properties of undefined (reading 'create')` 오류를 수정했습니다. 원인은 Electron sandbox preload에서 외부 모듈 `qrcode`를 require해 preload 전체가 로드되지 않은 것이었습니다.

preload는 이제 Electron 내장 IPC만 사용하고, QR 생성은 main 프로세스의 IPC handler가 data URL을 반환하도록 변경했습니다. 실제 Electron 런타임에서 preload-error가 사라지고 `window.monejo`와 `window.monejo.create`가 정상 노출되는 것을 확인했습니다.

v0.3.4의 HTTPS 기본 노드, 임시 지갑 생성·복구, 기존 wallet 파일 보관 기능도 유지합니다. 공식 Monero CLI/GUI 소스의 복구 흐름인 seed 검증 → seed language 판별 → wallet generate 기준도 계속 유지합니다.

## v0.3.4 — 2026-10-12

기본 노드와 생성·복구 파일 충돌 문제를 수정했습니다.
