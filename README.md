# josimi

josimi is a non-custodial Monero desktop wallet built with Electron. Its interface is available in Korean, English, Chinese, and Japanese. The current development target is **v1.2.0 for Windows x64 Portable**.

## Wallet features

- The first-run path prioritizes creating a wallet. To open an existing Monero GUI wallet, select its `.keys` file and enter its password.
- Restore from a standard Monero seed, with optional seed-offset passphrase and restore height. Existing wallet files are preserved before a default-path replacement.
- Manage multiple accounts and subaddresses, receive addresses and QR codes, address-book entries, transaction notes, and transaction history.
- Review recipient, amount, service fee, network fee, total debit, and fee address before a transfer is relayed.
- A durable recovery warning blocks new sends after an ambiguous relay and app restart until the user checks the recorded transaction hash.
- Recovery seeds are returned only after an explicit request, a localized native warning, and fresh wallet-password verification against a temporary in-memory copy. Password and seed-offset fields are cleared after use; JavaScript runtime memory cannot be guaranteed physically zeroized.

## Local node

On Windows, the node panel can download the official Monero CLI v0.18.5.4 archive over HTTPS, verify its source-pinned SHA-256, and start `monerod` as a hidden process. The node uses a pruned blockchain, binds administrative RPC and ZMQ to loopback only, disables UPnP/IGD port mapping, and passes `--hide-my-port` so it is not advertised as a peer-list candidate. The daemon still listens on its Monero P2P port; inbound reachability depends on the computer's firewall and network, which josimi does not configure. Outbound Monero P2P connections continue. The first blockchain sync may take hours or days and use substantial disk space and bandwidth. See [PRIVACY.md](PRIVACY.md) for data paths and network disclosures.

## Mining

Mining is optional and never starts by default. On Windows, the current implementation supports CPU mining through:

- Direct Stratum pool mining.
- Automatic pool selection by parallel TCP latency probes. Every reachable candidate can see the user's IP during probing.
- Local P2Pool main, mini, or nano, using the local synchronized monerod, bundled P2Pool, and XMRig.
- Solo mining through the local monerod RPC.

The app verifies pinned XMRig and P2Pool executable hashes before launch. P2Pool receives the wallet's public primary address and opens its P2P peer listener on all network interfaces; the profile uses its standard peer port and router UPnP mapping is disabled. The local Stratum listener remains loopback-only. CPU mining is supported; GPU mining is not currently implemented. XMRig's default developer donation and any pool fees may apply.

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

The Windows targets are built with `electron-builder`; the release workflow publishes `josimi.exe`, `josimi-1.2.0-x64.zip`, `josimi-1.2.0-source.zip`, `SHA256SUMS.txt`, and `build.log`.

## Important limitations

josimi is a mainnet wallet. A remote node can observe the computer's IP, connection timing, and wallet-related RPC patterns. A local daemon has an unauthenticated administrative RPC, restricted to loopback; other software on the same computer may still reach it. Pool operators and P2Pool peers have their own network and logging policies. The app does not implement GPU mining, multisig, hardware-wallet signing, or offline transaction signing.
