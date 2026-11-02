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

## Internal source review record (2026-10-26)

The v1.2.0 work received scoped, read-only internal source reviews on 2026-10-25 and 2026-10-26. Coverage included Electron IPC and renderer boundaries; wallet, key, seed, and password lifetimes; remote/local node RPC and the pinned Monero CLI download; mining modes, subprocesses, and bundled executable checks; transaction construction, fees, relay recovery and journal durability; CI, dependencies, tagged releases and artifact checksums; and privacy/security wording in the four supported languages. Follow-up reviews focused on seed reauthentication, local-node start/shutdown races, relay-journal durability, and release disclosures.

The reviews reported actionable issues, including missing password reauthentication before seed display, inaccurate P2Pool wording, local-node startup/shutdown races, incomplete relay-record minimization and durability details, and release-workflow controls. Code changes and regression tests were added for the issues addressed in this version. A follow-up source/SDK review of seed reauthentication found no actionable finding, but it did not use a real wallet fixture. The local-node race and relay schema fixes have focused regression tests; the Windows-specific durable file replacement and actual Monero download/extraction path were not exercised on Windows during this review.

This was an internal source-level review, not an independent third-party audit, penetration test, formal verification, or guarantee that no vulnerabilities remain. Reviewers inspected bounded source areas and did not perform a complete line-by-line certification of every dependency or every reachable runtime state. Tests and dependency audits provide useful evidence but do not prove correctness. In particular, JavaScript/WASM secret clearing is best-effort and cannot guarantee physical erasure from process memory; loopback RPC is not an authentication boundary against other processes under the same user; and mining pool/node operators may observe network metadata or public wallet addresses as described in the UI.

The internal review record above applies to the v1.2.0 source and release only. Follow-up work after that tag—including the Monero CLI bundling/build-staging path, named pool configuration, TLS probing, and mining connection-state reporting—is not covered by that review and has not received an independent security audit. Tests added for a later release are regression checks, not an audit.

## Internal source-review follow-up — v1.2.1 candidate (2026-11-01 to 2026-11-02)

The unreleased v1.2.1 candidate received scoped, read-only internal reviews of the bundled Monero runtime and release packaging, mining subprocess/pool/P2Pool lifecycle, and mining UI/localization/privacy wording. Reviewers identified a P2Pool child-reference race during error/cleanup, permissive mining IPC field handling, stale pool-status reporting, a health probe that accepted the marker without validating the HTTP response, incomplete extracted-runtime cleanup, and ambiguous accepted-share wording. The candidate was updated with confirmed-close tracking and fail-closed shutdown retries, strict typed/bounded IPC validation, fresh/disconnected pool state, exact P2Pool response parsing, runtime-directory/path checks and cleanup regressions, and an explicit share-count/payout caveat in all supported languages.

A 2026-11-02 follow-up review found that the release ZIP verifier did not inspect `resources/app.asar` and only checked certain names for a nested Monero archive. The verifier now enumerates the packaged ASAR, rejects Monero runtime files inside it, requires exactly one ASAR, and rejects nested ZIP files throughout the outer package. Synthetic ZIP fixtures confirmed that a clean ASAR is accepted and an ASAR containing a Monero archive is rejected. A separate review noted that the bundled SHA-256 manifest is not independently signed; the local-node status disclosure now states that limitation in Korean, English, Chinese, and Japanese.

This follow-up remains an internal source-level review, not an independent third-party audit, penetration test, formal verification, or guarantee that the fixes are complete. No actual Windows package build, official archive extraction, Windows monerod start/stop, Monero RPC mining session, P2Pool initial synchronization, live pool login/share acceptance, or pool payout was exercised. The ZIP verifier was tested with synthetic fixtures, not a real release ZIP. The local P2Pool health marker is unauthenticated and is only a heuristic against an ordinary unrelated listener. The Monero archive digest is pinned in repository source; the application and build verifier do not independently authenticate that pin against a Monero signature. The executable is unsigned and the build is not independently reproducible; checksums do not authenticate the publisher.

The release workflow compares the fetched release tag to the built commit both before publication and immediately before creating the release. A narrow race remains if a user with repository write permission force-updates or deletes the tag between that final check and GitHub's release creation. Repository-level protection or immutable-tag rules for `v*` tags are recommended; their configuration is outside the source review. Checksums detect byte changes relative to the published manifest, but do not authenticate the publisher or prove a reproducible build. Windows binaries remain unsigned, and no independent rebuild comparison has been performed.
