# monejo web wallet

Vercel에 배포할 수 있는 브라우저 비수탁형 Monero mainnet 지갑입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## Vercel 설정

Vercel 프로젝트 루트를 `web`으로 지정합니다.

권장 환경변수:

```text
MONERO_DAEMON_URL=https://your-trusted-monero-daemon.example
```

환경변수를 지정하지 않으면 기본 public node가 사용됩니다. 공개 노드는 연결 메타데이터를 볼 수 있고 언제든 중단될 수 있으므로, 실제 자금 사용에는 직접 운영하거나 신뢰할 수 있는 HTTPS 노드를 지정하세요.

## 보안 모델

- seed와 private key는 브라우저 메모리에서만 사용됩니다.
- 브라우저 저장소에는 password-derived AES-GCM으로 암호화한 seed만 저장합니다.
- Vercel 함수는 Monero daemon RPC 요청만 중계하며 seed/private key를 받지 않습니다.
- 송금 전 받는 주소, 0.25% 서비스 수수료, 최대 0.05 XMR 상한, 수수료 주소를 표시합니다.
- 공개 또는 공유 컴퓨터에서 사용하지 마세요.
- 독립 보안 감사 전에는 큰 금액을 보관하지 마세요.
