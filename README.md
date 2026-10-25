# josimi

비수탁형 Monero 지갑입니다. 현재 작업 버전은 **한국어·영어·중국어·일본어를 지원하는 mainnet Windows Portable (v1.1.3)**입니다.

## 현재 구현

- Electron 기반 Windows x64 ZIP (`josimi.exe` 포함)
- 한국어 / English / 中文 / 日本語 언어 선택
- 로컬 wallet 파일 저장 및 비밀번호 잠금
- 첫 실행은 새 지갑 만들기로 시작하며, 기존 지갑 열기는 `.keys` 파일을 선택한 뒤 비밀번호를 입력
- Monero seed 복구
- 복구 전 seed 형식 확인 및 기존 지갑 자동 보관
- 주소 표시·복사 / QR
- Monero GUI 방식의 여러 계정 및 계정별 하위 주소 생성·이름 변경·잔액 표시
- 계정 또는 하위 주소별 수신 주소 선택 및 QR 표시
- 지갑 내 주소록의 추가·편집·삭제와 송금 폼으로 주소 불러오기
- 모든 계정의 거래내역 및 지갑 안에 저장하는 거래 메모
- 선택한 계정에서 보내는 송금 검토·확인·relay
- 우선순위 선택
- 로컬 지갑 파일 백업
- 30초마다 잔액·거래내역을 갱신하고 수신 주소 변경 시 이전 QR을 숨김
- 노드 연결 실패를 별도 상태로 표시하며, 지갑 생성 시 복구 높이를 얻기 위해 지갑을 열기 전에 선택한 노드에 요청을 보낼 수 있음
- 신규 지갑은 8자 이상 비밀번호를 요구하고 기존 Monero GUI 지갑은 원래 짧거나 빈 비밀번호도 허용
- 복구 seed는 명시적으로 요청하고 확인한 때만 조회하며, 일반 생성 응답에는 포함하지 않음
- 세션 잠금 버튼 및 15분 비활동 자동 잠금
- 한국어 / English / 中文 / 日本語 UI와 중요한 송금·seed 안내 현지화
- 송금액의 0.25% josimi 서비스 수수료
  - 상한 0.05 XMR
- 송금 서비스 수수료 수취 주소: `42dHPCXn1K4jVvytbrHP4YZM4c5wpfFbKj38LXmC6AgL9mZcLZpn9DTGBtPjP9DfjXP27ZntfeBHjF2uSQoX11A55RexfyT`
- 송금 확인 전에 받는 주소, 서비스 수수료, 실제 네트워크 수수료 및 총 차감액을 표시
- relay 응답이 불확실하면 같은 서명 거래를 보존해 재시도하며, 기존 relay가 진행 중인 동안 중복 relay 요청을 차단; 앱 종료 대기는 제한 시간 후 명시적 확인을 표시
- 여러 건으로 분할되는 송금은 차단하며, 복원된 송금 검토에는 실제 출금 계정·메모를 다시 표시
- HTTPS 원격 Monero 노드 연결·동기화 상태 표시
- seed 복구 시 restore height 입력 및 생성 시 복구 높이 표시
- Portable EXE/ZIP 실행 위치의 기존 호환용 `josimi` 데이터 폴더에 지갑·노드 파일 저장
- 공식 SHA-256을 검증한 XMRig 기반 Windows CPU 채굴
- 20개 단위나 CPU 개수 상한 없이 양의 정수 스레드 수를 직접 입력
- `CPU 자동 100% 사용`을 켜면 XMRig의 `--cpu-max-threads-hint 100`으로 논리 CPU 전체를 자동 선택
- 직접 지정한 Stratum 풀, preset 중 TCP 지연이 가장 낮은 풀을 고르는 자동 풀 선택, 원격 P2Pool endpoint 지원
- 채굴은 사용자가 직접 시작하며, 풀 모드별 IP·주소 공개 차이를 네 언어로 안내

고급 기능의 단계별 범위는 [`GUI_PARITY_ROADMAP.md`](GUI_PARITY_ROADMAP.md)에 기록되어 있습니다. v1.1.0에서 계정·하위 주소·주소록·거래 메모를 추가했으며, 오프라인 서명·multisig·하드웨어 지갑은 아직 구현되지 않았습니다.

## 신뢰·보안 정보

- 개인정보와 네트워크 동작: [`PRIVACY.md`](PRIVACY.md)
- 취약점 비공개 신고 및 지원 범위: [`SECURITY.md`](SECURITY.md)
- Windows 다운로드 체크섬 확인: [`VERIFY_RELEASE.md`](VERIFY_RELEASE.md)
- GitHub Actions는 push와 pull request마다 테스트와 `npm audit`을 실행합니다. 새 버전 태그는 EXE, ZIP, 소스 ZIP, SHA-256SUMS, 빌드 로그를 만드는 릴리스 workflow를 실행합니다.
- GitHub private vulnerability reporting, Dependabot 취약점 알림 및 자동 보안 업데이트가 활성화되어 있습니다.

## 실행

```bash
npm install
npm start
```

현재 앱은 HTTPS 원격 노드를 사용합니다. 기본 endpoint는 `https://node.monerodevs.org:18089`이며, 원격 노드 운영자는 IP와 연결 메타데이터를 볼 수 있습니다. 지갑 생성 과정에서는 복구 높이를 얻기 위해 지갑을 열기 전에 선택 노드에 `get_info` 요청을 보낼 수 있습니다. 지갑이 열린 뒤에는 30초 간격으로 잔액·거래·노드 상태를 확인합니다. 생성·복구는 먼저 임시 파일에서 처리한 뒤 기존 지갑을 보관합니다.

지갑 화면의 **채굴** 패널은 Windows에서 직접 Stratum 풀, 자동 풀 선택 또는 원격 P2Pool endpoint를 지원합니다. 직접/자동 풀 모드에서는 현재 지갑의 primary address를 XMRig의 `-u` 값으로 전달합니다. P2Pool 모드에서는 josimi가 XMRig에 지갑 주소를 전달하지 않으므로, 보상 주소는 원격 P2Pool 설정에 달려 있고 앱이 이를 확인할 수 없습니다. 연결 전에 endpoint가 본인 지갑에 맞게 설정됐는지 확인하세요. XMRig 자체의 개발자 기부와 endpoint 수수료가 적용될 수 있습니다.

`CPU 자동 100% 사용`을 활성화하면 수동 스레드 입력 대신 XMRig가 논리 CPU 전체를 선택합니다. 이 설정은 CPU 사용률을 보장하는 것이 아니라 채굴 스레드 힌트를 100으로 주는 방식이므로, 발열·전력·노트북 배터리 상태를 확인하고 필요하면 `배터리 상태 무시`를 끄세요.

P2Pool 모드는 로컬 P2Pool 데몬을 실행하지 않고, 입력한 원격 stratum endpoint에 XMRig만 연결합니다. 이 모드에서 XMRig에 `-u` 지갑 주소를 전달하지 않으므로, endpoint를 직접 관리하거나 신뢰하고 지급 주소 설정을 확인한 뒤 사용하세요. 직접/자동 풀 모드에서는 공개 primary address가 풀에 전달되며, 주소와 다른 활동의 연결을 피하려면 별도 지갑을 고려하세요. 지갑 잠금·지갑 전환·앱 종료 시 XMRig 프로세스가 중지됩니다.

Portable EXE 또는 ZIP을 실행하면 실행 파일 옆에 기존 호환용 `josimi` 데이터 폴더가 만들어지고 그 아래에 `wallets`와 `node`가 생성됩니다. 이미 기존 `josimi` 데이터 폴더나 이전 AppData 지갑·노드가 있으면 새 파일로 덮어쓰지 않고 기존 파일을 우선 사용합니다. restore height는 첫 입금 거래보다 낮거나 같은 높이를 입력해야 하며, 모르면 낮은 값을 입력하는 것이 안전합니다.

현재 채굴 코드는 XMRig 프로세스 하나를 실행하며 josimi 수수료 주소로 채굴 스레드나 보상을 분배하지 않습니다. 직접/자동 풀 모드에서는 공개 primary address를 전달하지만 P2Pool 모드에서는 전달하지 않습니다. 풀 정책·수수료와 XMRig 개발자 기부는 별도로 적용될 수 있습니다.

## Windows 빌드

```bash
npm run dist
```

생성물:

- `dist/josimi.exe` — Windows Portable 단일 실행 파일
- `dist/josimi-1.1.3-x64.zip` — ZIP 배포본
- `dist/win-unpacked/`

앱은 자동 업데이트를 수행하지 않습니다. 새 버전은 GitHub 릴리스 페이지에서 직접 내려받으세요. 자동 릴리스 workflow는 SHA-256SUMS와 빌드 로그를 첨부하며, 검증 방법과 해시의 한계는 [`VERIFY_RELEASE.md`](VERIFY_RELEASE.md)를 참고하세요.

복구 흐름을 비교한 소스 참고 기록은 [`RESEARCH.md`](RESEARCH.md)에 있습니다.

josimi Electron preload는 외부 QR 모듈을 직접 require하지 않고 main IPC를 사용하므로 packaged EXE에서도 `window.josimi`가 정상 노출됩니다.

## 중요한 보안 고지

- 이 코드는 아직 **독립 보안 감사가 끝난 제품이 아닙니다**. 큰 금액을 보관하지 마세요.
- seed/private key는 채팅이나 외부 서버로 보내지 않도록 설계했지만, 사용자의 PC가 악성코드에 감염된 경우를 막아 주지는 않습니다.
- 복구 seed를 표시할 때 화면 노출에 주의하고, 복구 시 seed offset passphrase를 사용했다면 seed와 별도로 기록해 오프라인에 보관하세요.
- GitHub Actions의 테스트·의존성 감사와 해시 기록은 독립 보안 감사, 재현 가능한 빌드, 코드 서명 또는 해시 서명을 대체하지 않습니다. Windows EXE는 현재 코드 서명되지 않았습니다.
- 현재 lockfile 기준 `npm audit` 전체 의존성 취약점은 0건입니다. 이는 코드의 독립 보안 감사나 안전한 mainnet 사용을 보증하지 않습니다.
- 기본 public node는 신뢰 경계입니다. 노드 운영자는 IP 및 연결 메타데이터를 볼 수 있으므로 본인 노드 또는 Tor/I2P 같은 프라이버시 경로를 고려하세요.
- 현재 빌드는 mainnet 기본값입니다. testnet 지갑과 파일을 혼용하지 마세요.

## 다음 단계

1. Monero testnet 별도 빌드에서 생성·복구·동기화·소액 송금·백업 복원 통합 테스트
2. mainnet에서 소액 송금 후 블록 탐색기로 수수료 주소 수취 확인
3. OS 보안 저장소와 코드 서명 인증서 적용
4. 서비스 수수료 정책·법적 고지·환불/오류 처리 확정
5. EXE 독립 보안 감사 및 재현 가능한 빌드 적용


## v0.3.6 복구 검증

복구 화면은 Monero 공식 흐름에 맞춰 13/14/25단어 seed와 선택적 seed offset passphrase를 받습니다. 같은 seed를 offset 없이 복구하면 primary address가 같아야 하며, offset을 입력하면 다른 지갑 주소가 생성되는 것이 정상입니다. 생성·복구 후에는 저장 파일을 다시 열어 primary address가 바뀌지 않았는지도 검증합니다.


## v0.3.7 UI

GUI는 getmonero의 Monero GUI와 Cake Wallet의 실사용 화면에서 영감을 받아 정보 중심의 charcoal/orange 디자인으로 정리했습니다. 장식적인 효과를 줄이고 주소, 잔액, 송금, 거래내역의 가독성과 작업 흐름을 우선합니다.


## v0.3.8 UI

첫 화면은 홍보용 랜딩페이지가 아니라 지갑 앱의 시작 화면으로 단순화했습니다. 브랜드와 지갑 작업만 남기고 큰 슬로건, MAINNET 배지, 불필요한 네트워크 문구를 제거했습니다.
