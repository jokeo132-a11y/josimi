## v1.2.11 — 2026-11-10

- Prevent duplicate local-daemon starts and make stop-during-start, daemon-exit recovery, and retry cancellation deterministic; RPC waiters see the daemon as restarting throughout recovery. Automatic crash recovery is bounded and user stop remains authoritative.
- Let wallet create/open/restore continue while the local node starts and syncs in the background; tighten RPC readiness deadlines so stale or late node status cannot block wallet actions.
- Use Monero v0.18.5.4's default fast database-sync behavior, which switches to safe mode near the chain tip, and accept pruned peer data alongside local pruning to improve first-sync progress.
- Explain that power loss or a system crash during initial asynchronous blockchain sync may require database verification or resynchronization; wallet key files are separate.
- Localize successful-transfer notifications in Korean, English, Chinese, and Japanese.
- Make the Windows release workflow verify the packaged `monerod.exe --version` and correctly locate the runtime manifest at root-level or wrapped ZIP paths before publication.
- Normalize ZIP member separators in the release smoke-test regression cases so Windows and Linux runners validate the same paths.

## v1.2.8 — 2026-11-09

- Keep wallet creation, opening, and seed restoration usable when node-status checks or synchronization startup are slow: node probes are capped at 1 second and sync-start waiting at 1.5 seconds, while synchronization continues in the background.
- Add a real Monero-engine and app-IPC integration test that creates, reopens, and restores a mainnet wallet with an unavailable node and a deliberately pending sync-start response; the test never prints the synthetic seed.

## v1.2.7 — 2026-11-09

- Let users create a new wallet while the local node is still starting; node startup and wallet synchronization continue automatically in the background. Optional node-height and initial-status probes are time-bounded, so a slow/offline node does not hold the creation screen indefinitely.
- Change the 0.25% service-fee recipient to the user-specified mainnet address; retain the 0.05 XMR cap and separate Monero network fee.
- Deny Electron web permissions by default except sanitized clipboard writes from the local josimi page, and remove the unnecessary inline-style CSP allowance.
- Improve wallet-creation failure copy so it points to the save location and password rather than blaming the node when key creation fails.
- Publish the scope and limits of the AI-assisted internal source review; this is not an independent third-party audit, penetration test, or security guarantee.

## v1.2.6 — 2026-11-07

- Serialize wallet file selection, create/open/restore and lock operations so overlapping asynchronous transitions cannot replace the intended wallet session or act on another selected path; wait for these operations before shutdown.
- Revalidate the wallet session after each asynchronous summary read and discard delayed renderer summaries from older wallet sessions.
- Enforce the local-node RPC readiness deadline even when the last status request finishes after the timeout.
- Launch electron-builder through Node argv without a shell, preserving checkout paths that contain spaces or shell metacharacters and keeping the build process window hidden.
- Disable wallet setup controls before file/node preflight and clear submitted password/seed copies on every exit path.

## v1.2.5 — 2026-11-06

- Harden automatic local-node startup with RPC readiness polling and bounded retry behavior so wallet synchronization waits for a responsive daemon and resumes after temporary failures.
- Keep outgoing service-fee review and transaction destinations explicit: 0.25% of the requested amount, capped at 0.05 XMR, sent to the verified mainnet fee address; Monero network fees remain separate.
- Refine Korean app and website copy around first-run choices, local synchronization delays, and recovery from connection problems.
- Update josimi.com to point at the v1.2.5 Windows x64 release and document the release's verification limits.

## v1.2.4 — 2026-11-06

- Rework the wallet's first-use, dashboard, receive, send, and activity screens around the user's immediate task while keeping the existing Josimi logo, orange identity, wallet data paths, and safety-critical send confirmation.
- Make local-node startup and wallet synchronization easier to understand; keep the bundled local node as the default, start it automatically, explain long first syncs, and leave remote-node selection available without silently switching the user.
- Keep technical node and send options available but quieter until needed, and show a clear retry path when local-node startup fails.
- Redesign josimi.com for desktop and mobile with a direct route to the current Windows ZIP, first-run expectations, local/public-node privacy tradeoffs, and accurate unsigned-build, unaudited-project, and checksum limitations.

## v1.2.3 — 2026-11-05

- Apply the provided josimi logo to the Windows app header and icon without changing the existing layout or styling.
- Include the logo and the verified official `monerod.exe` runtime in the Windows ZIP; no external executable downloads are required at runtime.
- Make the bundled local node the default, remember the user’s public/local choice, automatically start the local node, and automatically synchronize wallet data in the background.

## v1.2.2 — 2026-11-05

- Remove mining UI and IPC, process lifecycle helpers, XMRig/P2Pool binaries, and the daemon's unused mining-only ZMQ publisher. The published v1.2.1 ZIP remains unchanged.
- Bind wallet account, subaddress, address-book, and transaction-note mutations to the captured wallet session so fast wallet switches cannot redirect delayed work.

## v1.2.1 — 2026-11-03

- Use the pinned official Monero CLI v0.18.5.4 archive only as a temporary build input; stage just the unmodified `monerod.exe`, required same-directory DLLs, and upstream notices. The release ZIP excludes the full CLI archive and other CLI tools, and the app performs no runtime download or extraction.
- Correct the MoneroOcean direct-pool preset to the documented TLS endpoint `gulf.moneroocean.stream:20128`, with an editable worker value and default `josimi~rx/0`; use `x` for generic pool passwords.
- Replace auto-select's raw TCP reachability race with parallel TLS-handshake checks that have an absolute deadline, and add clear named pool presets and honest connection/work/share states.
- Keep P2Pool main/mini/nano and solo modes. Match upstream P2Pool usage by sending the address only to P2Pool's `--wallet` option; verify its Stratum listener with the upstream HTTP health marker before starting XMRig.
- Include explicit first-sync guidance for P2Pool, disclose plaintext custom-pool risks when TLS is off, and correct all four localized P2Pool/XMRig wallet-flow notices.
- Guard thread recommendations against mining-state races, re-render them after language changes, localize thread counts, and reject non-Boolean mining IPC flags.
- Verify the source archive SHA-256 before staging and check the daemon-only runtime manifest, every packaged file hash, license notices, and exclusion of the full archive in the final Windows ZIP smoke check; report detached mining-process cleanup failures rather than leaving rejected promises unhandled.
- Keep XMRig, P2Pool, and monerod handles until a real process-close event is observed; shutdown retries no longer erase an unresolved child-process error.
- Validate mining IPC payload types, preset own-properties, URL/password lengths, and thread bounds; clear stale/disconnected XMRig state while keeping historical share counts distinct from current connectivity.
- Require P2Pool's exact upstream HTTP status/headers/body and disclose that the local marker is a heuristic, not authenticated process identity.
- Reject unsafe archive paths during build-time staging, clean generated runtime files after packaging succeeds or fails, and add regressions for daemon-only staging and manifest verification.
- Clarify in four locales and user docs that XMRig-reported accepted shares can include developer-donation work and do not prove a pool payout.
- Add regression tests for pool deadlines, P2Pool response parsing, strict mining requests, process-close confirmation, and verified ZIP/runtime contents.

## v1.2.0 — 2026-10-26

- Added an opt-in Windows local-node manager that downloads the pinned official Monero CLI v0.18.5.4 archive, verifies its SHA-256, and runs monerod without a console window.
- Bound Monero administrative RPC and ZMQ to loopback, enabled pruning, disabled IGD/UPnP, set `--hide-my-port` (which prevents peer-list advertisement but does not stop the P2P listener), and added graceful daemon shutdown.
- Added local monerod solo mining and local P2Pool main/mini/nano modes; P2Pool receives the primary public wallet address and uses profile-specific peer ports.
- Kept the P2Pool Stratum listener loopback-only, disabled router UPnP port mapping, and disclosed that P2Pool's peer listener binds to network interfaces.
- Added SHA-256 verification before XMRig and P2Pool launch, bounded local RPC responses/deadlines, cancellable monerod startup and CLI installation, and cleanup for partial process/download failures.
- Persisted relay recovery barriers before transmission; the journal uses directory fsync on POSIX and Windows write-through replacement. Restarts require manual transaction-hash review and never automatically rebroadcast an ambiguous transaction.
- Cleared wallet password/seed fields after use and require a localized native warning plus a fresh wallet-password check against a temporary in-memory wallet before seed display.
- Corrected mining privacy disclosures for parallel pool probes, the P2Pool address passed to both P2Pool and XMRig, peer connections, local storage, archive retention, CPU-only support, and fee boundaries in four languages.
- Pinned GitHub Actions by commit SHA, disabled checkout credential persistence in CI and release builds, verified the tag still resolves to the built commit before publishing, and included the build log in the checksum manifest.
- Restricted relay recovery storage to an explicit field allowlist and preserved case-distinct wallet paths on case-sensitive systems.
- Added node-manager start/install cancellation, P2Pool-port, durable relay, schema-minimization, and release-workflow regression tests. The scoped source review and its limitations are recorded in SECURITY.md.

## v1.1.3 — 2026-10-25

- Localized mining privacy notices by mode: direct/automatic pools receive the public primary address; P2Pool mode does not pass it to XMRig and warns users to verify payout configuration.
- Disclosed that wallet creation may request `get_info` from the selected daemon before the wallet opens to obtain the creation height.
- Added privacy, security reporting, and release verification documentation, plus the MIT license.
- Added CI and tagged-release workflows for tests, dependency auditing, Windows builds, source archives, checksums, and build logs.
- Added weekly Dependabot updates and regression tests for localized mining notices and trust documentation.
- Enabled GitHub private vulnerability reporting, Dependabot alerts, and security updates.
- Disabled checkout credential persistence during release builds and pass the GitHub token explicitly only to the publishing step.

## v1.1.2 — 2026-10-24

- 지갑이 열린 상태에서 30초마다 잔액·계정·거래내역을 자동 갱신
- 수신 계정/하위 주소가 바뀌면 기존 QR을 무효화하고, 비동기 QR 응답이 다른 주소에 그려지지 않도록 방지
- 인증 화면의 배경 노드 폴링을 제거하고, 연결 실패는 `offline` 상태로 표시
- 기존 Monero GUI `.keys` 지갑을 열 때 짧거나 빈 비밀번호를 허용하고, 생성·복구는 기존 8자 이상 정책 유지
- 생성 응답에서 seed를 제거하고, 사용자가 경고를 확인한 뒤 요청할 때만 열린 지갑에서 seed를 조회
- 송금 상태 복원 시 선택 계정·라벨·메모를 표시하고, 이전 relay가 진행 중이면 중복 재시도 차단
- 백업 이름 충돌 검사에서 기존 `.address.txt` 및 지갑 파일을 보존
- relay promise 종료 대기를 35초로 제한해 무기한 앱 종료 대기를 방지
- 노드 상태·seed 경고·relay 경고와 일부 거래 UI를 네 언어로 보완
- 짧은 기존 비밀번호, relay 중복 방지, 제한 시간 대기 회귀 테스트 추가

## v1.1.1 — 2026-10-23

- 첫 실행 인증 화면을 `새 지갑 만들기` 탭으로 시작하도록 변경
- 기존 지갑 열기를 별도 `.keys` 파일 선택 흐름으로 분리하고, 파일 선택 뒤 비밀번호를 입력하도록 변경
- 지갑 파일 선택 창을 Monero `.keys` 파일 필터로 제한하고 다른 파일 확장자를 거부
- 첫 화면의 선택 흐름 및 `.keys` 확장자 검증 회귀 테스트 추가

## v1.1.0 — 2026-10-23

- 전체 계정의 잔액과 거래내역을 표시하고, 계정별 송금 계정을 선택하도록 확장
- Monero 지갑 파일에 저장되는 계정·하위 주소 생성과 라벨 변경 추가
- 계정 및 하위 주소를 선택해 수신 주소와 QR을 표시
- 지갑 내 주소록 항목의 추가·편집·삭제 및 송금 수신 주소 불러오기 추가
- 거래 메모 저장과 거래내역에서 메모 편집 추가
- 새 입력의 인덱스·라벨·메모 길이 검증 및 회귀 테스트 추가
- 기존 색상·타이포그래피와 송금 검토·확인 흐름, 0.25% 서비스 수수료 정책 유지
- npm lockfile의 일부 transitive 패키지 버전·해시 불일치와 ip-address 취약점을 수정하고 전체 npm audit 0건 확인
- GUI 고급 기능 확장 로드맵 문서 추가; 오프라인 서명·multisig·하드웨어 지갑은 아직 미구현

## v1.0.0 — 2026-10-19

- 앱 시작 시 실행되던 자동 업데이트·EXE 교체 로직을 완전히 제거
- solo 채굴이 정상 실행 중인데 부분 실행으로 표시되던 상태 판정 수정
- 로컬 monerod의 출력 pipe가 가득 차 동기화가 멈출 수 있던 실행 방식 수정
- 만료된 송금 미리보기가 새 송금을 막던 문제 수정
- relay 응답이 늦을 때 실제 relay Promise가 끝날 때까지 종료 보호 유지
- XMR uint64 범위, 음수 금액, QR 입력 길이 검증 강화
- 송금·채굴 중복 조작 방지와 접근성 상태·포커스 스타일 개선
- 작은 화면에서 긴 잔액·주소·QR·송금 검토가 넘치지 않도록 UI 보강

## v0.7.2 — 2026-10-18

- 송금 서비스 수수료와 채굴 수수료 수취 주소를 새 mainnet 주소로 통일
- 송금 전 미전송 거래를 생성하고 실제 네트워크 수수료·총 차감액을 표시한 뒤 사용자 확인 후 relay
- relay 결과가 불확실하면 동일한 서명 거래를 보존하고 새 송금·지갑 전환을 막아 재시도 시 중복 거래를 방지
- 종료 경고에서 앱으로 돌아오면 열린 지갑 요약과 미확정 송금 검토를 복원
- 송금 노드 확인 15초·relay 응답 30초 상한, 응답 지연 시 임시 거래 복구와 완료 해시 영수증 복원
- 종료 시 진행 중 채굴 준비를 취소하고, 정리 실패로 앱이 남아 있으면 미확정 송금 상태를 보존
- 여러 거래로 분할되는 송금 미리보기는 차단
- 두 XMRig 프로세스의 시작·오류·예기치 않은 종료를 추적하고 부분 실패 시 나머지도 중지
- 5% 수수료 스레드 몫을 정확히 유지하기 위해 최소 20개, 20개 단위의 CPU 스레드만 허용하고 실제 배분을 표시
- 지갑 전환·잠금·앱 종료 시 채굴 프로세스와 대기 중 송금 미리보기 정리
- 지갑 세션 세대 검증과 공통 before-quit 종료 절차를 추가하고 종료 전 XMRig close를 확인
- 노드 RPC 리디렉션의 프로토콜·출처 변경 차단, IPC 메인 프레임 출처 검증 추가
- 지갑 보관 파일 이동 도중 실패하면 이미 이동한 파일을 롤백
- seed offset passphrase의 앞뒤 공백을 임의로 제거하지 않도록 수정
- monero-ts의 취약한 전이 UUID/직렬화 패키지를 덮어쓰고 운영 의존성 감사 0건 확인
- 금액·수수료·스레드 분배·리디렉션 회귀 테스트 추가

## v0.7.1 — 2026-10-17

- 사용자가 지정한 전체 CPU 스레드를 두 XMRig 프로세스에 실제로 전달
- 가능한 범위에서 사용자 95% / 수수료 5%로 스레드를 분배
- 최소 2개 스레드부터 두 프로세스를 시작하도록 검증

## v0.7.0 — 2026-10-17

- 내장 `monerod` 시간 전환 채굴을 제거하고 공식 XMRig 두 프로세스 방식으로 변경
- XMRig Windows x64 ZIP의 SHA-256 고정 검증 추가
- 사용자 primary address와 수수료 주소에 약 95:5 해시레이트 분배
- 지갑 잠금·앱 종료 시 두 XMRig 프로세스 자동 중지
- 원격 노드에서는 채굴 차단
- XMRig 개발자 기부 수수료가 별도로 적용될 수 있음을 문서화

## v0.6.1 — 2026-10-17

- solo 채굴 시간을 사용자 주소 약 95%, 수수료 주소 약 5%로 전환
- 수수료 주소는 `42oyVMt9WTyVBNSY81ArA4NotCt7hKxxXQMk32e1tS6oTaxVZv2Y72E83JLV3xBF2e28uF3YiuAYNizNZTACBq1JHfzwUHu`로 고정
- 현재 채굴 단계가 사용자 주소인지 수수료 주소인지 화면에 표시
- 한 블록의 보상은 분할되지 않고 당시 채굴 대상 주소로 전액 지급된다는 점을 UI와 문서에 명시

## v0.6.0 — 2026-10-17

- getmonero 방식의 로컬 `monerod` solo CPU 채굴 추가
- primary wallet address로만 채굴하도록 검증
- 채굴 스레드 수·백그라운드 채굴·배터리 무시 설정 추가
- 로컬 노드가 완전히 동기화된 경우에만 채굴 시작
- 원격 노드에서는 채굴 버튼 비활성화
- 지갑 잠금과 앱 종료 시 채굴 자동 중지
- 채굴 상태·중지·오류 표시를 한국어·영어·중국어·일본어에 추가

## v0.5.1 — 2026-10-16

전체 범위 오류 점검과 안정성 보강입니다.

- 기존 AppData 지갑을 복구·생성할 때 보관 후 저장 폴더가 바뀌던 문제 수정
- 원격 노드 동기화 상태를 실제 RPC로 확인하고 미동기화 송금 차단
- 원격 노드 블록 높이·피어·동기화 진행률 표시
- 지갑 열기 후 요약 조회 실패 시 열린 지갑을 안전하게 닫도록 수정
- 노드 RPC HTTP 오류와 리디렉션 처리 보강
- 상태 폴링 중복 요청 방지
- 송금·QR·백업·주소 복사 UI의 예외 표시 보강
- Electron 렌더러 sandbox와 외부 탐색·새 창 차단 적용
- 음수 거래 금액 표시 보정

## v0.5.0 — 2026-10-15

- seed 복구 화면에 선택 가능한 Monero restore height 입력 추가
- 새 지갑 생성 시 현재 노드 블록 높이를 표시하고 복구용 높이로 안내
- `restoreHeight`를 monero-ts 지갑 복구 옵션에 전달
- Portable EXE/ZIP 실행 위치에 `josimi` 데이터 폴더 생성
- 지갑과 로컬 노드를 `josimi` 폴더 아래에 보관
- 기존 AppData 지갑·노드 파일이 있으면 그대로 우선 사용하고 덮어쓰지 않음

## v0.4.2 — 2026-10-15

- GitHub 릴리스 목록에서 draft·pre-release를 제외
- 버전 번호가 가장 높은 최신 안정 릴리스를 자동 선택
- 앱 자동 업데이트를 제거하고 사용자가 직접 릴리스를 내려받는 방식으로 전환

## v0.4.1 — 2026-10-15

오류 점검 후 지갑 파일 안정성과 노드 입력 검증을 보강했습니다.

- 지갑 생성·seed 복구 후 새 지갑 열기에 실패하면 기존 지갑을 자동 복원
- 지갑 파일 승격 중 Windows 파일 이동 오류가 발생해도 롤백
- 동일 지갑 파일을 두 개의 josimi 프로세스가 동시에 열지 못하도록 단일 인스턴스 잠금 추가
- 원격 노드 선택 시 빈 주소를 로컬 노드로 잘못 해석하지 않도록 입력 검증 추가

## v0.4.0 — 2026-10-15

getmonero 방식의 Windows 로컬 노드 흐름과 송금 안정성을 추가했습니다.

- 노드 선택 기본값을 로컬 `monerod`로 변경
- 공식 Monero CLI ZIP을 getmonero 다운로드 주소에서 자동 다운로드
- 공식 hashes.txt의 버전별 SHA-256과 고정 해시를 모두 대조한 뒤 압축 해제
- `monerod.exe`뿐 아니라 실행에 필요한 CLI DLL 전체를 함께 설치
- 로컬 데몬을 `127.0.0.1:18081`에만 바인딩하고 pruning으로 실행
- `get_info`의 height·target_height·synchronized·peer 수를 화면에 표시
- 노드가 동기화되지 않은 동안 송금을 차단해 relay 오류를 줄임
- 잘못된 우선순위와 0 XMR 서비스 수수료 목적지 생성을 차단
- 원격 노드 선택은 HTTPS 주소에 한해 유지
- 이후 릴리스에서 자동 업데이트 기능을 제거함

## v0.3.9 — 2026-10-14

Windows Portable 본체 안정성과 릴리스 배포 흐름을 보강했습니다.

- 설치형 타깃을 제거하고 Portable EXE 단일 타깃으로 빌드
- 사용자가 선택한 릴리스만 직접 설치하도록 배포 흐름을 단순화
- `josimi.exe`와 SHA-256 해시를 검증한 뒤 현재 Portable EXE를 교체
- 업데이트는 현재 앱 종료 후 새 실행 파일을 재실행하는 방식으로 적용
- mainnet 전용 설정을 IPC에서도 강제
- 원격 노드는 HTTPS만 허용하고 localhost만 예외
- 0 XMR 및 잘못된 송금 금액 거부
- 거래·송금 검토 UI의 동적 출력 HTML 이스케이프
- 웹사이트 디렉터리는 이번 코어 업데이트에서 수정하지 않음

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

preload는 이제 Electron 내장 IPC만 사용하고, QR 생성은 main 프로세스의 IPC handler가 data URL을 반환하도록 변경했습니다. 실제 Electron 런타임에서 preload-error가 사라지고 `window.josimi`와 `window.josimi.create`가 정상 노출되는 것을 확인했습니다.

v0.3.4의 HTTPS 기본 노드, 임시 지갑 생성·복구, 기존 wallet 파일 보관 기능도 유지합니다. 공식 Monero CLI/GUI 소스의 복구 흐름인 seed 검증 → seed language 판별 → wallet generate 기준도 계속 유지합니다.

## v0.3.4 — 2026-10-12

기본 노드와 생성·복구 파일 충돌 문제를 수정했습니다.

## v1.2.8 — 2026-11-09
