# monejo download site

흰색 배경의 monejo 설명·다운로드 전용 사이트입니다.

## Vercel 업로드

이 디렉터리 전체를 Vercel 프로젝트로 업로드하세요.

```bash
npm install
npm run build
```

- Build Command: `npm run build`
- Output Directory: `dist`
- 다운로드 파일: `public/downloads/`

사이트의 다운로드 이름은 다음과 같이 고정됩니다.

- `monejo.exe` — Windows Portable 실행 파일
- `monejo.zip` — zip
- `SHA256SUMS.txt` — 해시 확인

seed나 개인키를 받지 않는 설명·다운로드 전용 사이트입니다. monejo 지갑은 아직 독립 보안 감사를 받지 않았으므로 큰 금액을 보관하지 마세요.
