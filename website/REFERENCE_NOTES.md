# 디자인 검토 참고 자료

검토 기준일: 2026-11-06 (KST). 최초 디자인 검토 당시 공개 릴리스는 v1.2.3이었습니다. 이후 승인된 v1.2.4 릴리스는 2026-11-06 KST에 GitHub Actions 빌드와 검증을 통과해 게시되었습니다.

## 공개 페이지와 릴리스

- 공식 사이트 `https://josimi.com/`를 확인했습니다. 첫 검토 때 사이트는 v1.2.3, 공개일 2026-11-05, Windows ZIP 약 163.2 MiB를 표시했습니다.
- 게시된 릴리스: `https://github.com/jokeo132-a11y/josimi/releases/tag/v1.2.4` — `josimi-1.2.4-x64.zip`, `josimi-1.2.4-source.zip`, `SHA256SUMS.txt`, `build.log`.
- 게시된 Windows ZIP과 GitHub의 공개 SHA-256 목록을 내려받아 대조했고 해시가 일치했습니다. Windows x64 ZIP 크기는 171,112,205 bytes (약 163.2 MiB)입니다.
- 최신 공개 릴리스 API: `https://api.github.com/repos/jokeo132-a11y/josimi/releases/latest`
- 릴리스 자동화 실행: `https://github.com/jokeo132-a11y/josimi/actions/runs/42214117128` (success).

## 신뢰·개인정보 설명의 기준

- 보안 상태: `https://github.com/jokeo132-a11y/josimi/blob/main/SECURITY.md`
- 개인정보 안내: `https://github.com/jokeo132-a11y/josimi/blob/main/PRIVACY.md`
- 릴리스 파일 검증 한계와 안내: `https://github.com/jokeo132-a11y/josimi/blob/main/VERIFY_RELEASE.md`

사이트의 체크섬 설명은 파일 동일성 확인과 소프트웨어 안전성 보장을 구분합니다. 공개 노드 운영자는 IP·연결 정보를 볼 수 있고, 로컬 노드도 Monero P2P 피어에 연결된다는 점을 설명합니다. 이 사실과 디자인 제안은 독립 보안 감사가 아닙니다.


## v1.2.5 release update — 2026-11-06

The v1.2.5 Windows release includes the final automatic local-node synchronization hardening and the fee transaction/review behavior documented in the source. The production site should point to the new v1.2.5 GitHub release after its tagged build succeeds.


## v1.2.6 bug-fix release update — 2026-11-07

The v1.2.6 patch addresses wallet lifecycle races, stale wallet summaries, strict local-node RPC readiness deadlines, and Windows build paths containing spaces or shell metacharacters. The production site should point at v1.2.6 only after the tagged Windows release workflow succeeds.

## v1.2.7 wallet-creation and fee update — 2026-11-09

The v1.2.7 update lets users create a wallet while the local node starts in the background, changes the service-fee recipient to the address confirmed by the maintainer, and adds default-deny Electron permission handling with a stricter local-page CSP. The site should point to the v1.2.7 Windows ZIP only after the tagged release workflow succeeds. This change is not an independent security audit; the existing site disclosure must continue to say so.

## v1.2.8 wallet lifecycle hardening — 2026-11-09

The v1.2.8 source caps node-status probes at 1 second and sync-start waiting at 1.5 seconds for create, open, and restore operations, so synchronization startup cannot indefinitely hold the wallet screen. A real Monero-engine/app-IPC integration test covers offline create, reopen, and seed restore, including a deliberately pending sync-start response. This test coverage is not an independent security audit; the site must continue to say so.
