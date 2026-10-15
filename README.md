# monejo

비수탁형 Monero 지갑 MVP입니다. 현재 릴리스는 **한국어·영어·중국어·일본어를 지원하는 mainnet Windows Portable (v0.5.0)**입니다.

## 현재 구현

- Electron 기반 Windows x64 ZIP (`monejo.exe` 포함)
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
- 송금액의 0.25% monejo 서비스 수수료
  - 상한 0.05 XMR
  - 수수료 주소: `42oyVMt9WTyVBNSY81ArA4NotCt7hKxxXQMk32e1tS6oTaxVZv2Y72E83JLV3xBF2e28uF3YiuAYNizNZTACBq1JHfzwUHu`
- 송금 전 수취 주소·서비스 수수료·총액을 사용자에게 표시
- 로컬 Monero 노드 자동 다운로드·실행·동기화 진행 표시
- seed 복구 시 restore height 입력 및 생성 시 복구 높이 표시
- Portable EXE/ZIP 실행 위치의 `monejo` 폴더에 지갑·노드 파일 저장

## 실행

```bash
npm install
npm start
```

기본값은 Windows 로컬 노드입니다. 처음 사용할 때 공식 Monero CLI ZIP을 다운로드하고 SHA-256을 확인한 뒤 `monerod`를 `127.0.0.1:18081`에서 실행합니다. 초기 동기화에는 상당한 시간과 디스크 공간이 필요합니다. 원하면 HTTPS 원격 노드를 선택할 수도 있습니다. 생성·복구는 먼저 임시 파일에서 처리한 뒤 기존 지갑을 보관합니다.

Portable EXE 또는 ZIP을 실행하면 실행 파일 옆에 `monejo` 폴더가 만들어지고 그 아래에 `wallets`와 `node`가 생성됩니다. 이미 기존 `monejo` 폴더나 이전 AppData 지갑·노드가 있으면 새 파일로 덮어쓰지 않고 기존 파일을 우선 사용합니다. restore height는 첫 입금 거래보다 낮거나 같은 높이를 입력해야 하며, 모르면 낮은 값을 입력하는 것이 안전합니다.

## Windows 빌드

```bash
npm run dist
```

생성물:

- `dist/monejo.exe` — Windows Portable 단일 실행 파일
- `dist/release/monejo.zip` — ZIP 배포본
- `dist/win-unpacked/`

실행 중인 Portable EXE는 앱 시작 후 GitHub 릴리스 목록에서 가장 높은 버전의 안정 릴리스만 선택합니다. 새 릴리스의 `monejo.exe`와 SHA-256 해시가 검증되면 별도 확인 없이 앱을 종료하고 새 EXE로 교체한 뒤 재실행합니다. draft와 pre-release는 제외합니다.

복구 흐름을 비교한 소스 참고 기록은 [`RESEARCH.md`](RESEARCH.md)에 있습니다.

Electron preload는 외부 QR 모듈을 직접 require하지 않고 main IPC를 사용하므로 packaged EXE에서도 `window.monejo`가 정상 노출됩니다.

## 중요한 보안 고지

- 이 코드는 아직 **독립 보안 감사가 끝난 제품이 아닙니다**. 큰 금액을 보관하지 마세요.
- seed/private key는 채팅이나 외부 서버로 보내지 않도록 설계했지만, 사용자의 PC가 악성코드에 감염된 경우를 막아 주지는 않습니다.
- Windows 배포 전 코드 서명 인증서, 재현 가능한 빌드, 해시 서명, 보안 감사가 필요합니다.
- `monero-ts`가 일부 의존성에 대한 npm audit 경고를 남기므로, mainnet에 큰 금액을 보내기 전 의존성 고정 및 추가 검토가 필요합니다.
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
