# Privacy and data handling

This document describes the current josimi desktop application. It is a source-level description, not an independent privacy or security audit.

## Wallet data stays on your computer

The application does not have a josimi wallet-hosting account or cloud backup service. In a Windows Portable build, its data directory is beside the executable at `josimi/`; wallet files are normally under `josimi/wallets/`. For compatibility, an existing wallet under Electron's user-data directory can be retained instead of being moved. A manually selected `.keys` wallet remains at the path you selected. Backups are written only to the destination you choose. Treat the complete wallet file set, backups, seed, and seed-offset passphrase as sensitive.

The wallet software uses a password when creating or opening the Monero wallet. A password does not protect a seed displayed on screen, a compromised computer, or an exposed backup.

## Network connections

The default daemon is `https://node.monerodevs.org:18089`; users can configure another HTTPS node or a local node. Creating a wallet can contact the selected daemon before the wallet opens: josimi requests `get_info` to obtain the current height shown as the new wallet's creation height and offered as a restore height. Restoring a wallet also uses the selected daemon for wallet synchronization. While a wallet is open, it requests synchronization, balance, and transaction information, including periodic refreshes. A remote node can observe the computer's IP address, connection timing, and wallet-related RPC request patterns. The application is designed not to send the seed or private spend key to the daemon, but a remote-node setup is still a trust and privacy trade-off. Use a node you trust or your own node when practical.

Some setup or runtime actions may contact software release/download hosts. josimi does not automatically update or replace the application executable.

## Optional mining

Mining is off until the user starts it and is supported on Windows. In direct-pool and automatic-pool modes, josimi passes the wallet's public primary address to the selected endpoint as XMRig's `-u` value. In P2Pool mode, josimi passes the remote endpoint and optional TLS setting to XMRig but does not pass the wallet address. That endpoint can observe the computer's IP address, connection timing, and submitted shares. The P2Pool payout address is determined outside josimi by the remote P2Pool setup, which the app cannot inspect or verify; confirm that the endpoint is configured for your wallet and use only an endpoint you control or trust. Direct-pool and automatic-pool operators can associate your public address with mining activity. Review the endpoint's TLS, logging, privacy, and fee policies before connecting.

The current mining implementation starts one XMRig process. In direct-pool and automatic-pool modes it uses the user's primary address; in P2Pool mode the address is not supplied to XMRig. It does not divert a share of mining threads or rewards to the josimi service-fee address. XMRig's own developer donation and endpoint-specific fees may still apply. Mining does not start in the background by default.

## Fees

Outgoing transfers have a josimi service fee of 0.25% of the requested amount, capped at 0.05 XMR, in addition to Monero's network fee. The service-fee address is `42dHPCXn1K4jVvytbrHP4YZM4c5wpfFbKj38LXmC6AgL9mZcLZpn9DTGBtPjP9DfjXP27ZntfeBHjF2uSQoX11A55RexfyT`. The confirmation screen displays the recipient, service fee, network fee, total debit, and fee address before relay. Review these fields every time.

## Telemetry and limits

A review of the application source and declared dependencies for the current release found no analytics or telemetry SDK and no intentional analytics collection endpoint. This statement is limited to the reviewed source and does not certify every dependency or runtime behavior; the project has not had an independent audit.

For security reports, see [SECURITY.md](SECURITY.md). For release-file verification, see [VERIFY_RELEASE.md](VERIFY_RELEASE.md).
