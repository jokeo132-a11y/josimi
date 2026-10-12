# monejo

비수탁형 Monero 지갑 MVP입니다. 현재 릴리스는 **한국어·영어·중국어·일본어를 지원하는 mainnet Windows ZIP (v0.3.5)**입니다.

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

## 웹앱 / Vercel

`web/` 디렉터리는 Vercel에 배포할 수 있는 브라우저 지갑입니다. Vercel 프로젝트의 Root Directory를 `web`으로 지정하고, `MONERO_DAEMON_URL`에 신뢰할 수 있는 HTTPS Monero daemon RPC 주소를 설정하세요. 기본 public node는 개발·소액 테스트용입니다.

```bash
cd web
npm install
npm run build
```

브라우저에서 seed와 private key를 보관하며, `web/api/daemon`은 daemon RPC만 중계합니다. 웹 지갑도 독립 보안 감사 전에는 큰 금액을 보관하지 마세요.

## 실행

```bash
npm install
npm start
```

기본 mainnet 노드는 `https://node.monerodevs.org:18089`입니다. 공개 노드는 중단·변경될 수 있으므로, 노드 입력란에 신뢰할 수 있는 본인 노드를 직접 지정하는 것을 권장합니다. 생성·복구는 먼저 임시 파일에서 처리한 뒤 기존 지갑을 보관합니다.

## Windows 빌드

```bash
npm run dist
```

생성물:

- `dist/monejo-0.3.5-windows.zip`
- `dist/win-unpacked/`

복구 흐름을 비교한 소스 참고 기록은 [`RESEARCH.md`](RESEARCH.md)에 있습니다.

Electron preload는 외부 QR 모듈을 직접 require하지 않고 main IPC를 사용하므로 packaged EXE에서도 `window.monejo`가 정상 노출됩니다.

## 중요한 보안 고지

- 이 코드는 아직 **독립 보안 감사가 끝난 제품이 아닙니다**. 큰 금액을 보관하지 마세요.
- seed/private key는 채팅·서버·Vercel로 보내지 않도록 설계했지만, 사용자의 PC가 악성코드에 감염된 경우를 막아 주지는 않습니다.
- Windows 배포 전 코드 서명 인증서, 재현 가능한 빌드, 해시 서명, 보안 감사가 필요합니다.
- `monero-ts`가 일부 의존성에 대한 npm audit 경고를 남기므로, mainnet에 큰 금액을 보내기 전 의존성 고정 및 추가 검토가 필요합니다.
- 기본 public node는 신뢰 경계입니다. 노드 운영자는 IP 및 연결 메타데이터를 볼 수 있으므로 본인 노드 또는 Tor/I2P 같은 프라이버시 경로를 고려하세요.
- 현재 빌드는 mainnet 기본값입니다. testnet 지갑과 파일을 혼용하지 마세요.

## 다음 단계

1. Monero testnet 별도 빌드에서 생성·복구·동기화·소액 송금·백업 복원 통합 테스트
2. mainnet에서 소액 송금 후 블록 탐색기로 수수료 주소 수취 확인
3. OS 보안 저장소와 코드 서명 인증서 적용
4. 서비스 수수료 정책·법적 고지·환불/오류 처리 확정
5. 웹앱을 Vercel에 연결하고 `MONERO_DAEMON_URL`을 본인 노드로 설정
6. 웹·EXE 모두 독립 보안 감사 및 재현 가능한 빌드 적용
