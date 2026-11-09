# josimi 내부 보안 점검 기록 — 2026-11-08

> **중요:** 이 기록은 AI 보조 정적 소스 검토와 자동 점검 결과입니다. 독립된 보안업체의 감사 보고서, 침투 테스트, 인증서 또는 안전 보증이 아닙니다. 따라서 이 문서만으로 josimi를 “독립 보안감사를 받은 지갑”이라고 홍보해서는 안 됩니다.

## 검토 대상과 결과

검토 기준은 공개된 v1.2.6 커밋 `e7bc6003f580ce98bb29a480a52f0c96dc0d9ad5`입니다. Electron/IPC 경계, 키·지갑 세션, 거래·수수료·릴레이, 로컬 노드/RPC, 빌드·의존성·릴리스 경로를 다섯 개의 분리된 읽기 전용 검토로 살펴봤습니다. 이 검토 범위에서는 재현 가능한 취약점이 확인되지 않았습니다. 이는 취약점이 없다는 증거가 아니며 전체 코드·의존성·실행 상태를 인증한 것도 아닙니다.

Electron용 Electronegativity 1.10.3도 Electron 44.9.3 버전을 지정해 실행했습니다. 이 도구의 upstream 저장소는 현재 유지보수 중단을 안내하고 있으므로, 결과는 사람이 다시 확인할 후보로만 취급했습니다.

## 확인한 경고와 적용한 보강

Electronegativity는 권한 요청 처리기 부재를 경고했습니다. Electron은 별도 권한 처리기가 없을 때 웹 권한 요청을 자동 허용할 수 있습니다. josimi는 필요한 주소 복사 기능만 유지하도록 `clipboard-sanitized-write`를 정확한 로컬 앱 페이지에서만 허용하고, 클립보드 읽기·미디어·알림·위치 정보 등 나머지 권한은 거부하도록 했습니다. 권한 요청과 권한 확인 처리기 모두에 같은 정책을 적용했습니다.

기존 CSP에는 `style-src 'unsafe-inline'`이 있었습니다. 앱에 인라인 스타일이나 동적 스타일 속성 사용이 없어 이 허용을 제거하고 `style-src 'self'`로 좁혔습니다. `img-src data:`는 QR 생성기가 PNG 데이터 URL을 반환해 화면에 표시하므로 남겼습니다. 이는 이미지 로딩 허용이며 스크립트 정책은 계속 `script-src 'self'`입니다. 스캐너의 낮은 심각도 CSP 후보는 이 데이터 이미지 허용을 두고 남아 있습니다.

중간 클릭 탐색 경고는 새 창 요청을 모두 거부하는 `setWindowOpenHandler`와 앱 파일 이외의 탐색을 막는 `will-navigate` 처리로 이미 제한돼 있었습니다. Electronegativity의 일반 preload 경고도 수동 검토했습니다. preload는 `contextIsolation`, `sandbox`를 켜고 `nodeIntegration`을 끈 상태에서 고정된 앱 기능만 노출합니다. 이 경고들에서 별도 취약점은 확인되지 않았습니다.

초기 검토 당시 이번 작업으로 추가한 `src/permission-policy.js`와 `test/permission-policy.test.js`, 그리고 기존 `src/main.js`, `src/index.html`, `test/trust.test.js` 변경은 로컬 작업 트리에만 있었습니다. 이 메모를 작성하던 2026-11-09에는 해당 보강이 v1.2.7 후보에 들어 있었으며, 태그된 Windows 릴리스 빌드 결과를 기다리고 있었습니다.

## 검증과 한계

회귀 테스트 61개가 모두 통과했고, `npm audit --audit-level=moderate`는 취약점 0건을 보고했습니다. 이는 테스트와 의존성 검사 결과일 뿐, 외부 감사의 대체물이 아닙니다.

검토는 정적 소스 확인에 한정됐습니다. 실제 Electron 앱 실행, Windows EXE 제작·검증, 실지갑 사용, 자금 이동, 로컬/공개 노드 연결, 네트워크 침투 테스트는 하지 않았습니다. GitHub 계정·저장소 보호 설정도 독립적으로 확인하지 않았습니다. v1.2.6 공개 실행 파일과 현재 수정된 작업 트리를 대조하는 재현 가능한 빌드도 수행하지 않았습니다.

## 후속 메모 — 2026-11-09

v1.2.7 후보에는 노드 준비를 기다리지 않는 새 지갑 생성 동작과 수수료 주소 변경도 들어 있습니다. 이 두 변경은 11월 8일 보안 검토 범위에 포함되지 않았습니다. 이 후속 메모 작성 시점에 v1.2.7 후보의 회귀 테스트 62개는 통과했고 `npm audit --audit-level=moderate`는 취약점 0건을 보고했습니다. 이는 독립 감사나 침투 테스트가 완료됐다는 뜻이 아닙니다. 작성 당시에는 태그된 Windows 릴리스 빌드도 아직 완료되지 않았습니다.

## 독립 외부 감사 경로

오픈소스 감사 조정 기관 OSTIF는 프로젝트 범위를 정하고 독립 감사팀을 연결하며, 수정 뒤 공개 보고서를 내는 절차를 안내합니다. OSTIF는 후원·자금 지원을 통해 유지관리자 비용을 없앤 사례가 있다고 설명하지만, josimi가 선정되거나 무료 지원을 받는다는 보장은 없습니다. OSTIF의 신청 안내는 첫 감사 비용이 범위와 복잡도에 따라 대략 미화 3만~20만 달러일 수 있고, 후원금 조달을 돕는다고 밝힙니다. 신청 문의는 아직 제출하지 않았습니다.

Electron 앱 자체를 전문적으로 검토하는 Doyensec도 후보입니다. 보고서가 실제 발행되기 전에는 어느 경로로도 감사 완료를 주장하지 않습니다. 유료 계약이나 비용 승인은 이 점검의 범위에 포함되지 않습니다.

## 참고 자료

- [Electron Session API — 권한 요청·확인 처리기](https://electronjs.org/docs/latest/api/session)
- [Electron Security 튜토리얼](https://electronjs.org/docs/latest/tutorial/security)
- [Electron WebContents API — 창 생성·탐색 제어](https://electronjs.org/docs/latest/api/web-contents)
- [Electronegativity upstream 저장소](https://github.com/doyensec/electronegativity)
- [OSTIF — 감사 신청 절차](https://ostif.org/get-an-audit/)
- [OSTIF — 유지관리자 지원과 비용 설명](https://ostif.org/why-ostif/)
- [Doyensec — Electron 앱 보안 테스트](https://doyensec.com/services/electronjs-based-applications.html)
