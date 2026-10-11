# Changelog

## v0.3.0 — 2026-10-11

Monero GUI의 WalletManager/Wallet 복구 흐름과 공식 wallet-file 동작을 참고해 복구 경로를 보강했습니다. seed 입력은 공백을 정규화하고 표준 단어 수를 사전 확인합니다. 복구할 때 기존 monejo wallet 파일을 바로 덮어쓰지 않고 날짜가 붙은 보관 폴더로 먼저 이동합니다. 복구가 실패하면 임시 파일을 삭제하고 원래 지갑을 유지합니다. 복구 전에는 사용자가 seed를 다시 확인하는 경고를 봅니다.

Windows 빌드는 `monejo` 제품명, `com.monejo.wallet` 앱 ID, `monejo` Start Menu/Desktop shortcut을 사용합니다. installer와 portable EXE의 파일명도 서로 덮어쓰지 않도록 분리했습니다.

> 독립 보안 감사 전에는 큰 금액을 보관하지 마세요. testnet과 소액 mainnet 송금으로 먼저 검증해야 합니다.

## v0.2.1 — 2026-10-11

Windows installer, portable EXE, ZIP 다운로드와 Vercel 다운로드 사이트를 추가했습니다.
