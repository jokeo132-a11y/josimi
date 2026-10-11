# monejo v0.3.0 구현 참고

이번 버전은 Monero GUI의 `src/libwalletqt/Wallet.cpp`, `WalletManager.cpp`, `Wallet.h`와 Monero GUI의 QML 화면 구조를 직접 확인하고, Monero wallet2의 표준 wallet-file/seed 복구 흐름을 기준으로 보강했습니다.

## 확인한 설계 원칙

- GUI는 지갑 생성, 기존 지갑 열기, seed 복구를 분리합니다.
- 복구 API는 seed, password, network, restore height를 분리된 입력으로 받습니다.
- seed는 지갑 화면에서 항상 노출하지 않고 명시적인 사용자 동작으로만 표시합니다.
- 전송은 수취 주소·금액·수수료를 검토한 뒤 relay합니다.
- 지갑 파일은 password로 보호되는 wallet keys 파일로 저장합니다.
- 네트워크 타입은 지갑 생성·복구·열기 전체에서 동일하게 유지해야 합니다.

## monejo에 반영한 보강

- seed를 공백 기준으로 정규화하고 12/13/24/25단어 형식을 사전 확인합니다.
- 복구 시 기존 `monejo-wallet` 파일을 자동 보관한 뒤 새 복구 지갑을 교체합니다.
- 복구 실패 시 임시 복구 파일을 삭제하고 원래 지갑을 유지합니다.
- 복구 전 사용자가 seed 입력을 다시 확인하는 경고를 봅니다.
- Windows installer/portable 산출물 이름을 분리하고 제품명·바로가기 이름을 `monejo`로 고정합니다.

## 추가로 필요한 검증

이 버전은 독립 보안 감사가 아닙니다. mainnet 큰 금액 사용 전 testnet에서 새 지갑 생성, 종료 후 재열기, 25단어 복구, 복구 전 기존 지갑 보관, 잔액 동기화, 소액 송금, 수신 확인, 백업 복원을 별도 테스트해야 합니다.

## 참고 소스

- https://github.com/monero-project/monero-gui
- https://github.com/monero-project/monero
- https://github.com/feather-wallet/feather
- https://www.getmonero.org/resources/user-guides/
- https://www.getmonero.org/resources/developer-guides/
