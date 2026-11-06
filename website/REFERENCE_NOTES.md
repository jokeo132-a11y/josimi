# 디자인 검토 참고 자료

검토 기준일: 2026-11-06 (KST)

## 공개 페이지와 릴리스

- 공식 사이트 `https://josimi.com/`를 직접 확인했습니다. 당시 공개 페이지에 표시된 릴리스는 v1.2.3, 공개일은 2026-11-05였고, Windows ZIP 크기는 약 163.2 MiB로 표시됐습니다.
- GitHub 최신 릴리스 메타데이터를 확인했습니다: `https://github.com/jokeo132-a11y/josimi/releases/tag/v1.2.3` — `josimi-1.2.3-x64.zip`, `josimi-1.2.3-source.zip`, `SHA256SUMS.txt`, `build.log`가 게시되어 있었습니다.
- 최신 공개 릴리스 API: `https://api.github.com/repos/jokeo132-a11y/josimi/releases/latest`

## 신뢰·개인정보 설명의 기준

- 보안 상태: `https://github.com/jokeo132-a11y/josimi/blob/main/SECURITY.md`
- 개인정보 안내: `https://github.com/jokeo132-a11y/josimi/blob/main/PRIVACY.md`
- 릴리스 파일 검증 한계와 안내: `https://github.com/jokeo132-a11y/josimi/blob/main/VERIFY_RELEASE.md`

사이트의 체크섬 설명은 파일 동일성 확인과 소프트웨어 안전성 보장을 구분해야 합니다. 공개 노드의 운영자가 IP·연결 정보를 볼 수 있다는 점과, 로컬 노드도 Monero P2P 피어에 연결된다는 점도 보안 문서의 표현과 맞춰야 합니다.
