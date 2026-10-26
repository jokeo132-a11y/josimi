# Verify a release

Download release files only from the repository's [GitHub Releases page](https://github.com/jokeo132-a11y/josimi/releases). Beginning with releases built by the repository's release workflow, each release includes `SHA256SUMS.txt`, the source archive, and `build.log` alongside the Windows EXE and ZIP.

## Windows PowerShell

Download `josimi.exe` and `SHA256SUMS.txt` from the same GitHub release, open PowerShell in that directory, and run:

```powershell
$expected = ((Get-Content .\SHA256SUMS.txt | Where-Object { $_ -match '\s+josimi\.exe$' }) -split '\s+')[0].ToLowerInvariant()
$actual = (Get-FileHash .\josimi.exe -Algorithm SHA256).Hash.ToLowerInvariant()
if (-not $expected -or $actual -ne $expected) { throw 'SHA-256 mismatch: do not run this file.' }
'SHA-256 matches the release checksum.'
```

For the ZIP, use the exact filename shown in the release. For v1.2.0:

```powershell
$expected = ((Get-Content .\SHA256SUMS.txt | Where-Object { $_ -match '\s+josimi-1\.2\.0-x64\.zip$' }) -split '\s+')[0].ToLowerInvariant()
$actual = (Get-FileHash .\josimi-1.2.0-x64.zip -Algorithm SHA256).Hash.ToLowerInvariant()
if (-not $expected -or $actual -ne $expected) { throw 'SHA-256 mismatch: do not extract or run this archive.' }
'SHA-256 matches the release checksum.'
```

Use the exact ZIP filename for the version you downloaded. On Linux, `sha256sum -c SHA256SUMS.txt` checks all listed files in the current directory. On macOS, use `shasum -a 256` and compare its result with the corresponding line in the checksum file.

## What a matching hash does and does not mean

A matching SHA-256 shows that the downloaded file is byte-for-byte consistent with the checksum you checked. It does not prove that the program is benign or that the checksum itself was published by the legitimate maintainer. Obtain both from the actual GitHub release page over HTTPS, check that the release tag and source match, and do not run a file if its hash differs. Windows binaries are currently not Authenticode-signed. The project has completed scoped internal source reviews, but has not undergone a formal independent third-party security audit.

The workflow's `build.log` records dependency installation, tests, audit, and packaging output for that tagged build; its SHA-256 is included in `SHA256SUMS.txt` alongside the EXE, ZIP, and source archive. The source archive is generated from the same tag. These records improve inspectability but are not a substitute for a signed/reproducible build or an independent audit.

Older releases created before the automated release workflow may not include `SHA256SUMS.txt`; their SHA-256 values are listed in the release notes. For example, v1.1.2 publishes hashes in its release notes.
