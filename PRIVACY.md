# Privacy and data handling

This document describes the current josimi Windows desktop application. It is based on the source and configured release artifacts; it is not an independent privacy or security audit.

## Wallet and application data

josimi has no wallet-hosting account, telemetry service, or cloud backup feature. A packaged wallet normally lives under the `josimi/wallets/` directory beside the portable executable. Existing user-data wallets are preserved for compatibility, and a wallet opened through a selected `.keys` file remains at the path selected by the user. Backups are written only to the destination selected in the save dialog. When default-path creation or restoration replaces an existing wallet, its files are retained in a timestamped `josimi-wallet-before-restore-*` directory; the app does not automatically delete these archives. Identify and protect any retained copies, or remove them yourself after making the backup decisions you intend. The wallet database and its `.keys` file, backups, seed, and seed-offset passphrase are sensitive.

Seed display is an explicit user action protected by a localized native confirmation and a fresh current-wallet-password check. Password verification opens a temporary in-memory wallet from the existing key/cache data; it does not change the wallet files or provide operating-system-level reauthentication. The app clears temporary byte arrays and password references on a best-effort basis; JavaScript strings and runtime memory cannot be guaranteed physically zeroized. A password does not protect a seed displayed on screen, a compromised computer, or an exposed backup.

The local daemon and its blockchain data are stored under Electron's user-data directory at `local-node/`; the downloaded CLI archive and extracted `monerod.exe` are under `local-node/node-runtime/`, and the pruned blockchain database and `monerod.log` are under `local-node/node/`. XMRig and P2Pool data, including `p2pool.log`, are stored under the user-data `miner/` directory. A durable relay-recovery file is stored in the user-data directory. It contains transaction hashes, a one-way hash of the wallet path, and recovery state; it does not contain wallet addresses, amounts, passwords, seeds, private keys, or signed transaction blobs.

## Monero node connections

The default remote daemon is `https://node.monerodevs.org:18089`. Users may choose another HTTPS daemon or run the included local-node workflow. Wallet creation can contact the selected daemon before the wallet opens: josimi calls `get_info` to obtain the current height displayed as the wallet creation height and offered as a restore height. Restore and normal wallet synchronization also contact the selected daemon. A remote operator can observe the computer's IP address, connection timing, and wallet-related RPC request patterns. The app is designed not to send a seed or private spend key to a daemon. A remote node remains a trust and privacy trade-off.

When the user chooses to install the local node, josimi downloads the official Monero Windows CLI v0.18.5.4 over HTTPS from `downloads.getmonero.org`. The archive is checked against a SHA-256 value pinned in the source before extraction. The daemon runs as a hidden process; no monerod console window is shown. Its administrative RPC binds to `127.0.0.1:18081`, and its ZMQ publisher binds to `127.0.0.1:18083`. The RPC has no application password, so other software running as the same user or malware on the computer may still access it. The daemon uses blockchain pruning and disables router UPnP/IGD port mapping. It passes Monero's `--hide-my-port` option, which prevents the node from advertising itself as a peer-list candidate; this option does **not** stop the daemon from listening on its default P2P port (`18080`) on network interfaces. Incoming reachability therefore also depends on the computer's firewall and network; josimi does not configure firewall rules. The daemon continues outbound Monero P2P connections. The first sync can take hours or days and consume substantial disk space and bandwidth. The app does not silently stop a local node when the wallet is locked; the user can stop it from the node panel, and it is stopped during normal app shutdown.

## Optional mining

Mining is off by default and starts only after the user selects a mode and presses Start. The current josimi mining controls support CPU mining only; GPU mining is not implemented. XMRig and P2Pool are bundled Windows runtimes whose executable hashes are checked before launch. XMRig's default developer donation is 1%; external pool fees and rules are controlled by those services.

In direct-pool mode, XMRig connects to the configured Stratum endpoint and sends the computer's IP address and the wallet's public primary address as its username. In automatic mode, josimi opens TCP probes to all configured candidates in parallel before selecting the lowest-latency responsive endpoint. Each reachable candidate can therefore see the computer's IP and the time of the probe, but those probes do not include the wallet address or mining shares. The candidates currently configured are HashVault (`pool.hashvault.pro:443`), SupportXMR (`pool.supportxmr.com:443`), and MoneroOcean (`gulf.moneroocean.stream:443`).

In local P2Pool mode, the bundled P2Pool process connects to the local monerod and receives the public primary wallet address as `--wallet`; XMRig also receives that same public address as `-u` while connecting to P2Pool's loopback Stratum listener (`127.0.0.1:3333`). The address can be visible to local process-inspection tools and may appear in public P2Pool reward/share data. P2Pool logs may contain public mining details. The P2Pool peer listener binds to all network interfaces on the profile's standard peer port: main `37889`, mini `37888`, or nano `37890`. Other peers may connect if the operating-system firewall and network permit it and can observe the node's IP and P2Pool activity. The app disables P2Pool UPnP port mapping; it does not create a router port-forwarding rule.

In solo mode, josimi sends the primary public address and mining settings to the local monerod's loopback-only `start_mining` RPC. Monero P2P peers can observe the node's IP and connection metadata. The app never sends the seed or private spend key to a mining pool, P2Pool, XMRig, or monerod.

The josimi service fee does not apply to mining rewards. It applies only to outgoing wallet transfers, as described below.

## Fees

Outgoing transfers have a josimi service fee of 0.25% of the requested amount, capped at 0.05 XMR, in addition to Monero's network fee. The service-fee address is `42dHPCXn1K4jVvytbrHP4YZM4c5wpfFbKj38LXmC6AgL9mZcLZpn9DTGBtPjP9DfjXP27ZntfeBHjF2uSQoX11A55RexfyT`. The confirmation screen displays the recipient, service fee, network fee, total debit, and fee address before relay. Review these fields every time.

## Telemetry and limits

The reviewed application source does not intentionally send analytics or telemetry. This does not certify every dependency or runtime behavior, and the project has not received a formal independent security audit. GitHub release checksums detect accidental or mismatched files only when compared with a trusted copy of the checksum; they do not independently authenticate the publisher.

For vulnerability reports, see [SECURITY.md](SECURITY.md). For release-file verification and its limitations, see [VERIFY_RELEASE.md](VERIFY_RELEASE.md).
