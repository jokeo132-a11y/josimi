'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('mining privacy notice is visible and translated in all supported languages', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  assert.match(html, /data-i18n="miningPrivacyNotice"/);
  for (const locale of ['ko', 'en', 'zh', 'ja']) {
    assert.match(renderer, new RegExp(`\\b${locale}: \\{[^\\n]*miningPrivacyNotice:`));
    assert.match(renderer, new RegExp(`\\b${locale}: \\{[^\\n]*miningPrivacyNotice:[^\\n]*P2Pool`));
  }
  const localizedStart = renderer.indexOf('const LOCALIZED_RUNTIME = {');
  const localizedEnd = renderer.indexOf('\n};', localizedStart);
  const activeLocalization = renderer.slice(localizedStart, localizedEnd);
  const miningFineLines = activeLocalization.split('\n').filter((line) => line.includes('miningFine:'));
  assert.equal(miningFineLines.length, 4);
  assert.ok(miningFineLines.every((line) => /CPU/.test(line)));
  const nodePrivacyLines = activeLocalization.split('\n').filter((line) => line.includes('nodeLocalNotice:'));
  const nodeStorageLines = activeLocalization.split('\n').filter((line) => line.includes('localNodeStorageNotice:'));
  const miningPrivacyLines = activeLocalization.split('\n').filter((line) => line.includes('miningPrivacyNotice:'));
  assert.equal(nodePrivacyLines.length, 4);
  assert.equal(nodeStorageLines.length, 4);
  assert.equal(miningPrivacyLines.length, 4);
  assert.ok(nodePrivacyLines.every((line) => /18080/.test(line) && /hide-my-port/.test(line)));
  assert.ok(nodeStorageLines.every((line) => /18080/.test(line) && /hide-my-port/.test(line)));
  assert.ok(miningPrivacyLines.every((line) => /--wallet/.test(line) && /loopback/.test(line)));
  assert.match(html, /id="miningPoolPlaintextNotice"[^>]*data-i18n="poolPlaintextWarning"/);
  assert.equal((renderer.match(/poolPlaintextWarning:/g) || []).length, 4);
  assert.ok(miningPrivacyLines.every((line) => /TLS/.test(line)));
  assert.match(html, /P2Pool은 주소.*모든 네트워크 인터페이스/);
});

test('privacy docs disclose node pre-contact, mining modes, P2Pool exposure, and fees', () => {
  const privacy = read('PRIVACY.md');
  const readme = read('README.md');
  const main = read('src/main.js');
  const seedHandler = main.slice(main.indexOf("ipcMain.handle('wallet-seed'"), main.indexOf("ipcMain.handle('wallet-account-create'"));
  const feeAddress = main.match(/const FEE_ADDRESS = '([1-9A-HJ-NP-Za-km-z]+)'/)?.[1];
  assert.ok(feeAddress);
  assert.match(privacy, /Wallet creation can contact the selected daemon before the wallet opens/);
  assert.match(privacy, /parallel TLS connection checks/);
  assert.match(privacy, /The P2Pool peer listener binds to all network interfaces/);
  assert.match(privacy, /does \*\*not\*\* stop the daemon from listening on its default P2P port/);
  assert.match(privacy, /Incoming reachability therefore also depends on the computer's firewall/);
  assert.match(readme, /It still listens on its Monero P2P port; inbound reachability depends on the computer's firewall/);
  assert.match(privacy, /fresh current-wallet-password check/);
  assert.match(privacy, /temporary in-memory wallet/);
  assert.match(privacy, /cannot be guaranteed physically zeroized/);
  assert.match(privacy, /MoneroOcean preset uses TLS at `gulf\.moneroocean\.stream:20128`/);
  assert.match(privacy, /XMRig connects only to P2Pool's loopback Stratum listener/);
  assert.match(privacy, /it receives neither the wallet address nor pool login credentials/);
  assert.match(privacy, /custom pool can use plaintext Stratum when TLS is disabled/);
  assert.match(readme, /Solo instead reports monerod's active mining status/);
  assert.match(readme, /custom pool with TLS disabled sends its wallet address and pool login in plaintext/);
  assert.match(privacy, /parallel TLS connection checks/);
  assert.match(seedHandler, /monerojs\.openWalletFull\(\{ keysData, cacheData, password/);
  assert.doesNotMatch(seedHandler, /activeWallet\.getSeed\(/);
  assert.match(seedHandler, /verificationWallet\.close\(false\)/);
  assert.match(privacy, /timestamped `josimi-wallet-before-restore-/);
  assert.match(privacy, /0\.25% of the requested amount, capped at 0\.05 XMR/);
  assert.ok(privacy.includes(`\`${feeAddress}\``));
  assert.match(privacy, /local monerod's loopback-only `start_mining` RPC/);
});

test('release build and publish jobs have least-privilege permissions and immutable action pins', () => {
  const release = read('.github/workflows/release.yml');
  const ci = read('.github/workflows/ci.yml');
  assert.match(release, /persist-credentials:\s*false/);
  assert.match(ci, /persist-credentials:\s*false/);
  assert.match(release, /build:[\s\S]*?permissions:\s*contents:\s*read/);
  assert.match(release, /publish:[\s\S]*?permissions:\s*contents:\s*write/);
  assert.match(release, /runs-on:\s*windows-latest/);
  assert.doesNotMatch(release.split('jobs:')[0], /contents:\s*write/);
  for (const workflow of [release, ci]) {
    for (const line of workflow.split('\n').filter((entry) => /^\s*uses: actions\//.test(entry))) {
      assert.match(line, /@[a-f0-9]{40}\s+# v\d/);
    }
  }
  assert.match(release, /sha256sum --check SHA256SUMS\.txt/);
  assert.match(release, /build\.log > SHA256SUMS\.txt/);
  assert.match(release, /python scripts\/verify-release-bundle\.py/);
  assert.match(release, /verify-release-bundle\.py/);
  assert.match(read('scripts/verify-release-bundle.py'), /hashlib\.sha256\(data\)\.hexdigest\(\)/);
  assert.match(read('scripts/verify-release-bundle.py'), /sourceArchiveSha256/);
  assert.match(release, /rev-list -n 1/);
});

test('Windows package stages only the pinned Monero daemon runtime and cleans generated files', () => {
  const packageJson = JSON.parse(read('package.json'));
  const prepare = read('scripts/prepare-monero-runtime.js');
  const cleanup = read('scripts/cleanup-monero-runtime.js');
  const build = read('scripts/build-windows.js');
  const nodeManager = read('src/node-manager.js');
  const verifier = read('scripts/verify-release-bundle.py');
  assert.match(packageJson.scripts.dist, /build-windows\.js/);
  assert.match(build, /finally/);
  assert.match(prepare, /MONERO_ARCHIVE_SHA256/);
  assert.match(prepare, /downloads\.getmonero\.org/);
  assert.match(prepare, /monero-win-x64-v/);
  assert.match(prepare, /result\.sha256 !== MONERO_ARCHIVE_SHA256/);
  assert.match(prepare, /stageArchive\(archivePath, OUTPUT_DIR/);
  assert.match(prepare, /sourceDir, entry\.name/);
  assert.match(cleanup, /assets', 'runtime', 'monero'/);
  assert.match(nodeManager, /isAllowedRuntimeName/);
  assert.match(nodeManager, /this\.hashFile\(filePath\)/);
  assert.doesNotMatch(nodeManager, /node:https|Expand-Archive|downloadOfficialArchive/);
  assert.match(verifier, /monerod\.exe/);
  assert.match(verifier, /The full Monero CLI archive must not be shipped/);
  assert.match(verifier, /Nested ZIP archives, including the full Monero CLI archive/);
  assert.match(verifier, /list_asar_paths/);
  assert.match(verifier, /Expected exactly one packaged app\.asar/);
  assert.match(verifier, /basename == 'monerod\.exe'/);
  assert.match(verifier, /Bundled Monero runtime file hash mismatch/);
});

test('mining runtime uses bounded pool probes and a P2Pool-specific Stratum health marker', () => {
  const main = read('src/main.js');
  const poolProbe = read('src/pool-probe.js');
  const p2poolProbe = read('src/p2pool-probe.js');
  const processGuard = read('src/process-guard.js');
  const minerStatus = read('src/miner-status.js');
  const renderer = read('src/renderer.js');
  const index = read('src/index.html');
  const readme = read('README.md');
  const privacy = read('PRIVACY.md');
  const p2poolStart = main.slice(main.indexOf('async function startP2Pool'), main.indexOf('function waitForMinerClose'));
  assert.match(main, /probeMiningPool\(pool, \{ timeoutMs: 4500 \}\)/);
  assert.match(poolProbe, /setTimeout\(\(\) => finish\(new Error\('풀 연결이 제한 시간/);
  assert.match(main, /validateMiningRequest\(payload\)/);
  assert.match(main, /const connected = isMinerPoolReady\(userMiner\)/);
  assert.match(minerStatus, /MINER_ACTIVITY_STALE_MS/);
  assert.match(minerStatus, /POOL_DISCONNECTED/);
  assert.match(minerStatus, /function deriveMiningState/);
  assert.match(minerStatus, /function createMinerOutputParser/);
  assert.match(main, /createMinerOutputParser\(entry/);
  assert.match(main, /deriveMiningState\(\{ starting, mode, processCount, expectedProcesses, connected, sharesAccepted \}\)/);
  assert.match(renderer, /miningStatusUnavailable/);
  assert.equal((renderer.match(/miningStatusUnavailable:/g) || []).length, 4);
  const miningPrivacyLines = renderer.slice(renderer.indexOf('const LOCALIZED_RUNTIME = {'), renderer.indexOf('\n};', renderer.indexOf('const LOCALIZED_RUNTIME = {'))).split('\n').filter((line) => line.includes('miningPrivacyNotice:'));
  assert.equal(miningPrivacyLines.length, 4);
  assert.ok(miningPrivacyLines.every((line) => /Solo/.test(line) && /monerod/.test(line) && /settings|설정|设置|設定/.test(line)));
  assert.match(main, /stopMiningFromProcessEvent\(\)/);
  assert.doesNotMatch(main, /void stopMining\(\);/);
  assert.doesNotMatch(p2poolStart.slice(p2poolStart.indexOf("child.once('error'"), p2poolStart.indexOf("child.once('close'")), /p2poolProcess\s*=\s*null/);
  assert.match(p2poolStart.slice(p2poolStart.indexOf("child.once('close'")), /markProcessClosed\(child\)/);
  assert.match(main, /miningProcesses = entries\.filter\(\(entry\) => !isProcessCloseConfirmed/);
  assert.match(main, /hasUnconfirmedMiningChildren\(\)/);
  assert.match(processGuard, /MINER_CLOSE_UNCONFIRMED/);
  assert.match(processGuard, /child\.once\('close', onClose\)/);
  assert.match(p2poolProbe, /P2Pool Stratum online/);
  assert.match(p2poolProbe, /headers\.get\('content-length'\)/);
  assert.match(p2poolProbe, /body\.equals\(Buffer\.from\(HEALTH_MARKER/);
  assert.equal((renderer.match(/miningShareNotice:/g) || []).length, 4);
  assert.match(index, /data-i18n="miningShareNotice"/);
  assert.match(readme, /may include its developer-donation work/i);
  assert.match(privacy, /does not prove that a pool credited or paid a reward/i);
  assert.match(main, /waitForP2PoolStratum\(RPC_HOST, 3333/);
});

test('relay state is durable before broadcast and missing transaction hashes fail closed', () => {
  const main = read('src/main.js');
  const guard = read('src/relay-guard.js');
  const walletSend = main.slice(main.indexOf("ipcMain.handle('wallet-send'"));
  assert.ok(walletSend.indexOf("persistRelayState(pending, 'relaying')") < walletSend.indexOf('relayStarted = true'));
  assert.ok(walletSend.indexOf('relayStarted = true') < walletSend.indexOf('activeWallet.relayTxs(pending.txs)'));
  assert.match(main, /hashes\.length !== pending\.txs\.length/);
  assert.match(guard, /Too many unresolved relay recovery records/);
  assert.doesNotMatch(guard, /entries\.slice\(0, entries\.length - MAX_RECORDS\)/);
  assert.match(guard, /fs\.fsyncSync\(fd\)/);
  assert.match(guard, /MoveFileExW/);
  assert.match(guard, /MOVEFILE_WRITE_THROUGH/);
});

test('release verification docs disclose checksum limitations and audit status', () => {
  const security = read('SECURITY.md');
  const verify = read('VERIFY_RELEASE.md');
  assert.match(security, /independent security audit/i);
  assert.match(verify, /does not prove/i);
  assert.match(verify, /not Authenticode-signed/i);
  assert.match(verify, /\$version = '1\.2\.1'/);
  assert.match(verify, /Split-Path \$zip -Leaf/);
});
