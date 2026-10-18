# josimi v0.8 채굴 설계 근거

## 요구사항

- 채굴 스레드의 기존 20개 단위/최대 CPU 수 제한 제거
- 직접 지정한 Monero Stratum 풀 사용
- 알려진 풀 중 자동 선택
- P2Pool 로컬 노드 자동 다운로드·실행·동기화
- P2Pool 원격 노드 선택
- 기존 UI 스타일은 유지

## 공식 근거

- P2Pool 공식 사이트: https://p2pool.io/
  - 동기화된 monerod가 필요하다.
  - P2Pool은 기본 stratum `127.0.0.1:3333`을 제공한다.
  - `--mini`, `--nano` 사이드체인을 지원한다.
  - monerod에는 `--zmq-pub tcp://127.0.0.1:18083`이 필요하다.
  - P2Pool 지갑 주소는 공개되므로 전용 지갑 사용을 권장한다.
- P2Pool 공식 릴리스: https://github.com/SChernykh/p2pool/releases/latest
  - Windows x64 ZIP 자산과 GitHub SHA-256 digest를 사용할 수 있다.
- XMRig 풀 설정: https://xmrig.com/docs/miner/config/pool
  - `url`, `user`, `pass`, `tls`, `daemon` 설정을 지원한다.
- Monero 공식 풀 가이드: https://www.getmonero.org/resources/user-guides/mine-to-pool.html
  - 풀은 지갑 주소를 요구한다.
  - 사용자가 직접 풀을 선택하거나 풀 목록에서 선택할 수 있다.

## 구현 원칙

- Solo: 기존 로컬 monerod + XMRig daemon 모드를 유지한다.
- Direct pool / Auto pool: 사용자의 지갑 주소를 XMRig `-u`로 사용하며 서비스 수수료용 별도 프로세스는 만들지 않는다.
- P2Pool local: monerod를 ZMQ 옵션으로 시작하고, P2Pool을 공식 릴리스에서 digest 검증 후 설치한다. P2Pool이 제공하는 로컬 stratum에 XMRig를 연결한다.
- P2Pool remote: 사용자가 `host:3333`을 지정하거나 알려진 endpoint를 선택한다. 로컬 P2Pool/monerod를 설치하지 않는다.
- 자동 풀 선택은 코드에 포함한 검증된 preset의 TCP latency를 측정해 가장 빠른 endpoint를 선택하고, 실패 시 첫 preset을 사용하지 않고 오류를 표시한다.
- 스레드는 양의 정수만 검증하고 20개 단위나 CPU 개수 상한을 적용하지 않는다. 단, 운영체제와 XMRig가 실제로 처리할 수 있는 범위는 사용자 책임임을 UI에 표시한다.
