# josimi

josimi is a non-custodial Monero desktop wallet built with Electron. Its interface is available in Korean, English, Chinese, and Japanese. The current development target is **v1.2.1 for Windows x64 Portable (unreleased)**.

## Wallet features

- The first-run path prioritizes creating a wallet. To open an existing Monero GUI wallet, select its `.keys` file and enter its password.
- Restore from a standard Monero seed, with optional seed-offset passphrase and restore height. Existing wallet files are preserved before a default-path replacement.
- Manage multiple accounts and subaddresses, receive addresses and QR codes, address-book entries, transaction notes, and transaction history.
- Review recipient, amount, service fee, network fee, total debit, and fee address before a transfer is relayed.
- A durable recovery warning blocks new sends after an ambiguous relay and app restart until the user checks the recorded transaction hash.
- Recovery seeds are returned only after an explicit request, a localized native warning, and fresh wallet-password verification against a temporary in-memory copy. Password and seed-offset fields are cleared after use; JavaScript runtime memory cannot be guaranteed physically zeroized.

## Local node

The Windows release ZIP includes the unmodified official Monero v0.18.5.4 `monerod.exe`, its required runtime DLLs, and upstream license notices. It does **not** include the full Monero CLI archive or its other tools. The full official CLI archive is a temporary build input: the release build checks its SHA-256 against the value published by Monero, extracts only the daemon and required same-directory DLLs, then removes the temporary archive. The app does not download or extract Monero components at runtime. Before launch, it checks the bundled file hashes against the included manifest; that manifest is not independently signed, so this detects file mismatch relative to the manifest but does not authenticate a tampered manifest. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the included Monero license for provenance and redistribution terms. The daemon runs without a console window, uses a pruned blockchain, binds administrative RPC and ZMQ to loopback only, disables UPnP/IGD port mapping, and passes `--hide-my-port` so it is not advertised as a peer-list candidate. It still listens on its Monero P2P port; inbound reachability depends on the computer's firewall and network, which josimi does not configure. Outbound Monero P2P connections continue. The first blockchain sync may take hours or days and use substantial disk space and bandwidth. See [PRIVACY.md](PRIVACY.md) for data paths and network disclosures.

## Mining

Mining is optional and never starts by default. On Windows, the current implementation supports CPU mining through:

- Direct Stratum pool mining.
- Automatic pool selection by parallel TLS handshake checks with a connection deadline. Candidate pools can see the user's IP during probing; a handshake does not validate pool login or accepted shares.
- Named direct-pool presets, including MoneroOcean over TLS at `gulf.moneroocean.stream:20128` with a configurable worker value (default `josimi~rx/0`), plus a custom host/port option.
- Local P2Pool main, mini, or nano, using the local synchronized monerod, bundled P2Pool, and XMRig.
- Solo mining through the local monerod RPC.

The app verifies pinned XMRig and P2Pool executable hashes before launch. P2Pool receives the wallet's public primary address; XMRig connects to its loopback Stratum listener without a wallet login. The app checks P2Pool's local HTTP health marker so an unrelated service on port 3333 is less likely to be mistaken for P2Pool; this marker is a local heuristic, not authenticated process identity. P2Pool still needs its own initial sync after monerod is ready; this commonly takes 5–10 minutes, during which XMRig may show a connecting state. P2Pool opens its peer listener on all network interfaces; the profile uses its standard peer port and router UPnP mapping is disabled. In pool and P2Pool modes, the app distinguishes connecting from receiving work and only reports mining after XMRig reports an accepted share. The displayed accepted-share count is XMRig-reported, may include its developer-donation work, and does not confirm a payout credited by the pool. Solo instead reports monerod's active mining status because it does not use XMRig. A custom pool with TLS disabled sends its wallet address and pool login in plaintext; use TLS when the pool supports it. A local hardware recommendation uses the detected logical CPU count and RAM as a conservative starting point; it is not a hashrate or temperature guarantee. CPU mining is supported; GPU mining is not currently implemented. XMRig's default developer donation and any pool fees may apply.

The josimi service fee applies only to outgoing wallet transfers. It is **0.25% of the requested amount, capped at 0.05 XMR**, plus Monero's network fee. No josimi fee is taken from mining rewards.

## Trust and security

- [Privacy and data handling](PRIVACY.md)
- [Security reporting policy and review scope](SECURITY.md)
- [Release verification instructions](VERIFY_RELEASE.md)

CI runs tests and `npm audit --audit-level=moderate`. Release builds run the same checks, create a Windows EXE and ZIP plus a source ZIP, generate SHA-256 checksums and a build log, then publish the files in a separate least-privilege job. GitHub Actions are pinned to commit SHAs.

A scoped internal source-level review and automated checks are not a formal third-party security audit. Windows executables are not Authenticode-signed, and builds are not independently reproducible or cryptographically attested. A matching checksum detects file mismatch only when the checksum itself is obtained from a trusted source. Do not store significant funds in an unaudited wallet.

## Build from source

Use Node.js 22 and run:

```bash
npm ci
npm test
npm audit --audit-level=moderate
npm run dist
```

The Windows targets are built with `electron-builder`; the tagged release workflow publishes `josimi.exe`, a versioned `josimi-<version>-x64.zip`, a matching `josimi-<version>-source.zip`, `SHA256SUMS.txt`, and `build.log`.

## Important limitations

josimi is a mainnet wallet. A remote node can observe the computer's IP, connection timing, and wallet-related RPC patterns. A local daemon has an unauthenticated administrative RPC, restricted to loopback; other software on the same computer may still reach it. Pool operators and P2Pool peers have their own network and logging policies. The app does not implement GPU mining, multisig, hardware-wallet signing, or offline transaction signing.
