# josimi

비수탁형 Monero 지갑 MVP입니다. 현재 소스 버전은 **한국어·영어·중국어·일본어를 지원하는 mainnet Windows Portable (v1.0.0)**입니다.

## 현재 구현

- Electron 기반 Windows x64 ZIP (`josimi.exe` 포함)
- 한국어 / English / 中文 / 日本語 언어 선택
- 로컬 wallet 파일 저장 및 비밀번호 잠금
- 새 지갑 생성 / Monero seed 복구 / 지갑 열기
- 복구 전 seed 형식 확인 및 기존 지갑 자동 보관
- 주소 표시·복사 / QR
- 잔액·거래내역 조회
- 송금 검토·확인·relay
- 우선순위 선택
- 로컬 지갑 파일 백업
- 자동 잠금의 기반이 되는 세션 잠금 버튼
- 한국어 UI
- 송금액의 0.25% josimi 서비스 수수료
  - 상한 0.05 XMR
- 송금 서비스 수수료 수취 주소: `42dHPCXn1K4jVvytbrHP4YZM4c5wpfFbKj38LXmC6AgL9mZcLZpn9DTGBtPjP9DfjXP27ZntfeBHjF2uSQoX11A55RexfyT`
- 송금 확인 전에 받는 주소, 서비스 수수료, 실제 네트워크 수수료 및 총 차감액을 표시
- relay 응답이 불확실하면 같은 서명 거래를 보존해 재시도하며, 해결 전 새 송금·지갑 전환을 막음; 여러 건으로 분할되는 송금은 차단
- 로컬 Monero 노드 자동 다운로드·실행·동기화 진행 표시
- seed 복구 시 restore height 입력 및 생성 시 복구 높이 표시
- Portable EXE/ZIP 실행 위치의 기존 호환용 `josimi` 데이터 폴더에 지갑·노드 파일 저장
- 공식 SHA-256을 검증한 XMRig 기반 Windows CPU 채굴
- 20개 단위나 CPU 개수 상한 없이 양의 정수 스레드 수를 직접 입력
- `CPU 자동 100% 사용`을 켜면 XMRig의 `--cpu-max-threads-hint 100`으로 논리 CPU 전체를 자동 선택
- 직접 지정한 Stratum 풀, 기본 preset 중 TCP 지연이 가장 낮은 풀을 고르는 자동 풀 선택, 로컬 solo 채굴 지원
- P2Pool main/mini/nano 선택, 공식 Windows x64 P2Pool ZIP의 GitHub SHA-256 digest 검증 후 자동 다운로드·실행
- P2Pool을 로컬 Monero 노드와 함께 동기화하거나 원격 P2Pool stratum endpoint 선택

## 실행

```bash
npm install
npm start
```

기본값은 Windows 로컬 노드입니다. 처음 사용할 때 공식 Monero CLI ZIP을 다운로드하고 SHA-256을 확인한 뒤 `monerod`를 `127.0.0.1:18081`에서 실행합니다. 초기 동기화에는 상당한 시간과 디스크 공간이 필요합니다. 원하면 HTTPS 원격 노드를 선택할 수도 있습니다. 생성·복구는 먼저 임시 파일에서 처리한 뒤 기존 지갑을 보관합니다.

지갑 화면의 **채굴** 패널에서 모드를 고를 수 있습니다. Solo는 동기화된 로컬 monerod에 XMRig daemon 모드로 연결하고, 직접 풀은 입력한 Stratum endpoint와 현재 지갑 주소를 사용합니다. 자동 풀은 기본 preset을 TCP probe해 가장 빠른 endpoint를 선택합니다. 수수료 주소로 별도 채굴 프로세스를 만들지 않으며, 채굴 보상은 선택한 풀·P2Pool·solo 설정에 따라 현재 지갑 주소로 귀속됩니다. XMRig 자체의 개발자 기부 수수료가 별도로 적용될 수 있으므로 사용 전에 확인하세요.

`CPU 자동 100% 사용`을 활성화하면 수동 스레드 입력 대신 XMRig가 논리 CPU 전체를 선택합니다. 이 설정은 CPU 사용률을 보장하는 것이 아니라 채굴 스레드 힌트를 100으로 주는 방식이므로, 발열·전력·노트북 배터리 상태를 확인하고 필요하면 `배터리 상태 무시`를 끄세요.

P2Pool 로컬 모드는 먼저 공식 Monero CLI를 `--zmq-pub tcp://127.0.0.1:18083` 옵션과 함께 시작하고, Monero 노드가 완전히 동기화된 뒤 공식 P2Pool Windows x64 릴리스를 GitHub digest로 검증해 설치합니다. P2Pool은 main/mini/nano 중 선택한 sidechain을 열고 XMRig는 `127.0.0.1:3333`에 연결합니다. 원격 모드는 `host:3333` endpoint로 바로 연결합니다. P2Pool은 지갑 주소가 공개되므로 전용 채굴 지갑 사용을 권장하며, 최초 동기화에는 상당한 시간·RAM·디스크가 필요합니다. 지갑 잠금·지갑 전환·앱 종료 시 XMRig와 로컬 P2Pool은 자동으로 중지됩니다.

Portable EXE 또는 ZIP을 실행하면 실행 파일 옆에 기존 호환용 `josimi` 데이터 폴더가 만들어지고 그 아래에 `wallets`와 `node`가 생성됩니다. 이미 기존 `josimi` 데이터 폴더나 이전 AppData 지갑·노드가 있으면 새 파일로 덮어쓰지 않고 기존 파일을 우선 사용합니다. restore height는 첫 입금 거래보다 낮거나 같은 높이를 입력해야 하며, 모르면 낮은 값을 입력하는 것이 안전합니다.

## Windows 빌드

```bash
npm run dist
```

생성물:

- `dist/josimi.exe` — Windows Portable 단일 실행 파일
- `dist/josimi-1.0.0-x64.zip` — ZIP 배포본
- `dist/win-unpacked/`

앱은 자동 업데이트를 수행하지 않습니다. 새 버전은 GitHub 릴리스 페이지에서 사용자가 직접 내려받고, 배포된 체크섬을 별도로 확인한 뒤 교체하세요.

복구 흐름을 비교한 소스 참고 기록은 [`RESEARCH.md`](RESEARCH.md)에 있습니다.

josimi Electron preload는 외부 QR 모듈을 직접 require하지 않고 main IPC를 사용하므로 packaged EXE에서도 `window.josimi`가 정상 노출됩니다.

## 중요한 보안 고지

- 이 코드는 아직 **독립 보안 감사가 끝난 제품이 아닙니다**. 큰 금액을 보관하지 마세요.
- seed/private key는 채팅이나 외부 서버로 보내지 않도록 설계했지만, 사용자의 PC가 악성코드에 감염된 경우를 막아 주지는 않습니다.
- Windows 배포 전 코드 서명 인증서, 재현 가능한 빌드, 해시 서명, 보안 감사가 필요합니다.
- 현재 lockfile 기준 `npm audit --omit=dev` 운영 의존성 취약점은 0건입니다. 전체 감사에는 최신 `electron-builder` 개발 의존성의 중간 심각도 경고 8건이 남아 있어, 독립 보안 감사나 안전한 mainnet 사용을 보증하지 않습니다.
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
