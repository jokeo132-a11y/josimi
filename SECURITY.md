# Security Policy

## Supported versions

Security fixes are intended for the latest stable release. Older releases are not promised security updates; upgrade only after checking the release notes and verifying the download.

## Report a vulnerability privately

Use GitHub's private vulnerability reporting form: <https://github.com/jokeo132-a11y/josimi/security/advisories/new>. Private reporting is enabled for this repository. Do not post exploitable details in public Issues, Discussions, or pull requests.

Please include the affected release/commit, operating system, reproduction steps, and impact. Never include a wallet seed, private key, password, real wallet file, or funds. A minimal test wallet is safer.

The maintainer will make a best-effort attempt to acknowledge reports within 7 calendar days. This is a target, not a guaranteed SLA; this project has no paid bug bounty or 24/7 response service. Please allow time for a fix and coordinated disclosure before publishing details.

## Scope and limitations

josimi handles mainnet wallet files and has not received an independent security audit. `npm audit` and the project's automated tests are useful checks, not proof that the wallet is safe. The Windows executable is not Authenticode-signed, and builds are not yet independently reproducible. Do not store significant funds in the application.

Reports about the Electron app, wallet lifecycle, transaction construction/relay, bundled runtimes, or release pipeline are in scope. Social engineering, attacks requiring an already-compromised operating system, and third-party Monero node or mining-pool outages are not security bugs in josimi itself, though relevant impact can still be reported privately.
