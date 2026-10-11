# Changelog

## v0.2.1 — 2026-10-11

Windows 다운로드 경로를 확장했습니다. 웹 지갑 첫 화면에서 GitHub Release의 설치형 EXE, portable EXE, ZIP, SHA-256 검증 파일과 릴리스 페이지로 바로 이동할 수 있습니다. Windows용 NSIS 설치 프로그램과 portable 실행 파일을 새로 빌드하고, 압축된 `win-unpacked` ZIP도 제공합니다.

웹앱은 Vercel에 배포할 수 있으며, `MONERO_DAEMON_URL` 환경변수로 신뢰할 수 있는 Monero daemon RPC를 연결합니다.

> 이 릴리스는 독립 보안 감사를 받지 않았습니다. 큰 금액을 보관하지 말고 소액으로 먼저 검증하세요.

## v0.2.0 — 2026-10-11

monejo에 Vercel 배포용 브라우저 지갑을 추가했습니다. `web/`을 Vercel 프로젝트 루트로 지정할 수 있으며, seed는 브라우저에서 AES-GCM으로 암호화해 저장하고 Vercel 함수는 공개 daemon RPC만 중계합니다.

## v0.1.0 — 2026-10-11

Windows x64 portable Electron wallet MVP를 추가했습니다. 비수탁형 로컬 지갑 생성·복구, mainnet 송금, 주소·QR, 잔액·거래내역, 수수료 검토, 15분 자동 잠금과 로컬 백업을 포함합니다.
