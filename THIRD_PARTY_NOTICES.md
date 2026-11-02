# Third-party notices

## Monero daemon

The Windows local-node bundle redistributes the unmodified `monerod.exe` and its required runtime DLLs from the official Monero v0.18.5.4 Windows x64 distribution. The full Monero CLI archive is used only as a build input; the josimi package does not include the other CLI executables. The official archive is checked against the SHA-256 published in the Monero release notes before the runtime files are staged.

Upstream release: <https://github.com/monero-project/monero/releases/tag/v0.18.5.4>
Official archive: <https://downloads.getmonero.org/cli/monero-win-x64-v0.18.5.4.zip>
SHA-256: `1ccac3b476ba75bf6dfdfa848f6520a79b64cdf3457a160eaa0dad82d5a2a042`

The Monero license is included in `licenses/monero/LICENSE.txt` and in the packaged daemon runtime. This notice does not imply that the Monero daemon is josimi-authored or modified.
