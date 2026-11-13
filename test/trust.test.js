'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('the current source contains no mining UI, IPC, modules, or bundled runtimes', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  const main = read('src/main.js');
  const preload = read('src/preload.js');
  const nodeManager = read('src/node-manager.js');
  const readme = read('README.md');
  const privacy = read('PRIVACY.md');
  const website = read('website/index.html');
  const packageJson = JSON.parse(read('package.json'));
  const verifier = read('scripts/verify-release-bundle.py');
  for (const source of [html, renderer, main, preload, nodeManager]) {
    assert.doesNotMatch(source, /xmrig|p2pool|mining|start_mining|stop_mining|zmq-pub/i);
  }
  assert.match(html, /id="localNodeStatus"/);
  assert.match(main, /ipcMain\.handle\('local-node-stop'/);
  assert.match(main, /bundledRuntimePath\('monero'\)/);
  assert.deepEqual(packageJson.build.asarUnpack, ['assets/runtime/monero/**/*']);
  assert.ok(packageJson.build.files.includes('assets/runtime/monero/**/*'));
  assert.doesNotMatch(JSON.stringify(packageJson.build), /assets\/runtime\/\*\*\/\*/);
  for (const relativePath of [
    'src/mining-config.js', 'src/miner-status.js', 'src/mining-ui-state.js',
    'src/pool-probe.js', 'src/p2pool-probe.js', 'src/process-guard.js',
    'src/solo-mining-lifecycle.js', 'assets/runtime/xmrig', 'assets/runtime/p2pool'
  ]) assert.equal(fs.existsSync(path.join(root, relativePath)), false, relativePath);
  assert.match(verifier, /is_miner_artifact/);
  assert.match(verifier, /forbidden mining component/);
  assert.match(readme, /v1\.2\.2 removes mining entirely/i);
  assert.match(privacy, /Mining disclosures below apply only to the older v1\.2\.1 ZIP/i);
  assert.match(html, /src="\.\.\/assets\/josimi-logo\.png"/);
  assert.equal(packageJson.version, '1.2.22');
  assert.ok(website.includes(`"softwareVersion":"${packageJson.version}"`));
  assert.ok(website.includes(`releases/download/v${packageJson.version}/josimi-${packageJson.version}-x64.zip`));
  assert.ok(packageJson.build.files.includes('assets/josimi-logo.png'));
  assert.equal(fs.readFileSync(path.join(root, 'assets/josimi-logo.png')).subarray(1, 4).toString(), 'PNG');
  assert.match(html, /<option value="local" selected/);
  assert.match(renderer, /localStorage\.getItem\('josimi\.language'\) \|\| 'en'/);
  assert.match(renderer, /if \(!LANG\[language\]\) language = 'en'/);
  assert.match(renderer, /localStorage\.getItem\('josimi\.nodeMode'\)/);
  assert.match(renderer, /startLocalNodeInBackground\(\)/);
  const configureNodeInput = renderer.slice(renderer.indexOf('async function configureNodeInput'), renderer.indexOf("$('languageSelect').addEventListener", renderer.indexOf('async function configureNodeInput')));
  assert.doesNotMatch(configureNodeInput, /startLocalNodeInBackground\(\)/);
  assert.match(renderer, /status\.running && Number\(status\.rpc\?\.targetHeight\) > 0/);
  assert.match(renderer, /state === 'synced'[\s\S]*?toFixed\(2\).*sync\.targetHeight/);
  assert.match(renderer, /await ensureLocalNodeStartedOnce\(\)/);
  assert.match(renderer, /localNodeWaitReady\(\)/);
  assert.match(html, /class="node-manager-actions hidden"/);
  assert.match(main, /waitForRpcReady\(getLocalNodeManagerStatus\)/);
  assert.match(main, /walletSyncRetryDelayMs/);
  assert.match(main, /activeWallet\.startSyncing\(10_000\)/);
  assert.match(preload, /localNodeStart: \(\) => ipcRenderer\.invoke\('local-node-start'\)/);
});

test('Electron denies unneeded web permissions and uses a restrictive local-page policy', () => {
  const html = read('src/index.html');
  const main = read('src/main.js');
  const permissionPolicy = read('src/permission-policy.js');
  const windowSetup = main.slice(main.indexOf('async function makeWindow()'), main.indexOf("ipcMain.handle('app-config'"));
  assert.match(permissionPolicy, /setPermissionRequestHandler/);
  assert.match(permissionPolicy, /setPermissionCheckHandler/);
  assert.match(windowSetup, /installPermissionPolicy\(mainWindow\.webContents\.session, APP_URL\)/);
  assert.ok(windowSetup.indexOf('installPermissionPolicy') < windowSetup.indexOf('loadFile'));
  assert.match(windowSetup, /setWindowOpenHandler\(\(\) => \(\{ action: 'deny' \}\)\)/);
  assert.match(windowSetup, /will-navigate/);
  assert.match(html, /style-src 'self';/);
  assert.doesNotMatch(html, /unsafe-inline/);
});

test('privacy docs disclose legacy v1.2.1 mining and current wallet, seed, and fee behavior', () => {
  const privacy = read('PRIVACY.md');
  const readme = read('README.md');
  const main = read('src/main.js');
  const seedHandler = main.slice(main.indexOf("ipcMain.handle('wallet-seed'"), main.indexOf("ipcMain.handle('wallet-account-create'"));
  const feeAddress = main.match(/const FEE_ADDRESS = '([1-9A-HJ-NP-Za-km-z]+)'/)?.[1];
  assert.ok(feeAddress);
  assert.match(privacy, /a node that is slow or unavailable does not prevent a new wallet from being created/);
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
  assert.match(readme, /Solo reported monerod's active mining status/);
  assert.match(readme, /custom pool with TLS disabled sent its wallet address and pool login in plaintext/);
  assert.match(privacy, /parallel TLS connection checks/);
  assert.match(seedHandler, /monerojs\.openWalletFull\(\{ keysData, cacheData, password/);
  assert.doesNotMatch(seedHandler, /activeWallet\.getSeed\(/);
  assert.match(seedHandler, /verificationWallet\.close\(false\)/);
  assert.match(privacy, /timestamped `josimi-wallet-before-restore-/);
  assert.match(privacy, /0\.25% of the requested amount, capped at 0\.05 XMR/);
  assert.ok(privacy.includes(`\`${feeAddress}\``));
  assert.match(privacy, /local monerod's loopback-only `start_mining` RPC/);
});

test('configured service fee address is a valid Monero mainnet address and matches the disclosure', async () => {
  const main = read('src/main.js');
  const privacy = read('PRIVACY.md');
  const feeAddress = main.match(/const FEE_ADDRESS = '([1-9A-HJ-NP-Za-km-z]+)'/)?.[1];
  assert.ok(feeAddress);
  assert.equal(feeAddress, '47ky8dusihATq9gGbQiEL9dMUfBKzgEm5ExF7yx8ANxvBVDe57e58kY1FV56zyx1CUFUJwT6YqB4XJWnAV9HiKp2MkmSkNt');
  const { MoneroUtils, MoneroNetworkType } = require('monero-ts');
  assert.equal(await MoneroUtils.isValidAddress(feeAddress, MoneroNetworkType.MAINNET), true);
  assert.equal(await MoneroUtils.isValidAddress(feeAddress, MoneroNetworkType.TESTNET), false);
  assert.ok(privacy.includes(`\`${feeAddress}\``));
});

test('wallet lifecycle does not wait indefinitely for node or sync startup', () => {
  const main = read('src/main.js');
  const renderer = read('src/renderer.js');
  const formStart = renderer.indexOf("$('walletForm').addEventListener('submit'");
  const formEnd = renderer.indexOf("$('refreshBtn').addEventListener('click', refresh);", formStart);
  assert.ok(formStart >= 0 && formEnd > formStart);
  const submitHandler = renderer.slice(formStart, formEnd);
  assert.match(submitHandler, /if \(nodeModeValue === 'local'\) \{\s*nodeValue = localNodeUrl;\s*if \(localNodeExplicitlyStopped\) throw new Error\(LANG\[language\]\.localNodeStopped\);\s*await ensureLocalNodeStartedOnce\(\);/);
  assert.match(submitHandler, /await ensureLocalNodeStartedOnce\(\)/);
  assert.match(renderer, /localNodeRpcWaitFailed: '로컬 노드가 응답하지 않아 연결을 확인하지 못했습니다/);
  assert.match(renderer, /status\.restarting/);
  assert.match(read('src/node-manager.js'), /restartMaxAttempts = 5/);
  assert.match(main, /response\.result\.nettype !== 'mainnet'/);
  assert.match(main, /info\.synchronized !== true/);
  assert.match(main, /withTimeout\(getNodeHeight\(activeConfig\.node\), WALLET_LIFECYCLE_NODE_PROBE_TIMEOUT_MS/);
  assert.match(main, /WALLET_SYNC_START_TIMEOUT_MS = 1_500/);
  assert.match(main, /async function startWalletBackgroundSyncWithinDeadline\(/);
  const lifecycle = main.slice(main.indexOf("registerWalletOperationHandler('wallet-create'"), main.indexOf("ipcMain.handle('wallet-refresh'"));
  assert.equal((lifecycle.match(/loadStartupSummary\(wallet\)/g) || []).length, 3);
  assert.equal((lifecycle.match(/startWalletBackgroundSyncWithinDeadline\(wallet\)/g) || []).length, 3);
});

test('successful transfer notifications use the active locale', () => {
  const renderer = read('src/renderer.js');
  for (const code of ['ko', 'en', 'zh', 'ja']) assert.match(renderer, new RegExp(`Object\\.assign\\(LANG\\.${code}, \\{ sendSuccess:`));
  assert.match(renderer, /showTransferSuccessToast\(result\.txHashes\)/);
  assert.match(renderer, /showTransferSuccessToast\(status\.txHashes\)/);
  assert.doesNotMatch(renderer, /showToast\(`송금 완료/);
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
  assert.doesNotMatch(release, /josimi\.exe/);
  assert.match(release, /python scripts\/verify-release-bundle\.py/);
  assert.match(release, /verify-release-bundle\.py/);
  assert.match(release, /python scripts\/smoke-test-monero-runtime\.py/);
  assert.match(read('scripts/smoke-test-monero-runtime.py'), /--version/);
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
  assert.equal(packageJson.build.win.target, 'zip');
  assert.doesNotMatch(build, /portable/);
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
  assert.match(verifier, /list_asar_entries/);
  assert.match(verifier, /asar\.statFile/);
  assert.match(verifier, /entry\['unpacked'\]/);
  assert.match(verifier, /Expected exactly one packaged app\.asar/);
  assert.match(verifier, /basename == 'monerod\.exe'/);
  assert.match(verifier, /Bundled Monero runtime file hash mismatch/);
  assert.deepEqual(packageJson.build.asarUnpack, ['assets/runtime/monero/**/*']);
  assert.ok(packageJson.build.files.includes('assets/runtime/monero/**/*'));
  assert.match(verifier, /is_miner_artifact/);
  assert.match(verifier, /forbidden mining component/);
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

test('wallet metadata mutations are bound to the captured wallet session', () => {
  const main = read('src/main.js');
  const handlers = [
    ['wallet-account-create', 'wallet-account-label'],
    ['wallet-account-label', 'wallet-subaddress-create'],
    ['wallet-subaddress-create', 'wallet-subaddress-label'],
    ['wallet-subaddress-label', 'wallet-addressbook-add'],
    ['wallet-addressbook-add', 'wallet-addressbook-edit'],
    ['wallet-addressbook-edit', 'wallet-addressbook-delete'],
    ['wallet-addressbook-delete', 'wallet-transaction-note'],
    ['wallet-transaction-note', 'node-status']
  ];
  for (const [channel, nextChannel] of handlers) {
    const start = main.indexOf(`ipcMain.handle('${channel}'`);
    const end = main.indexOf(`ipcMain.handle('${nextChannel}'`, start);
    assert.ok(start >= 0 && end > start, `handler ${channel} exists in expected order`);
    const source = main.slice(start, end);
    assert.match(source, /captureWalletSession\(\)/, `${channel} captures wallet identity`);
    assert.match(source, /assertWalletSession\(activeWallet, sessionId\)/, `${channel} validates wallet identity after awaits`);
    assert.doesNotMatch(source, /await wallet\./, `${channel} does not dereference the mutable global wallet after awaits`);
  }
});

test('wallet selection and lifecycle IPC handlers share the single-flight operation gate', () => {
  const main = read('src/main.js');
  const renderer = read('src/renderer.js');
  for (const channel of ['wallet-file-choose', 'wallet-create', 'wallet-open', 'wallet-restore', 'wallet-lock']) {
    assert.match(main, new RegExp(`registerWalletOperationHandler\\('${channel}'`));
  }
  assert.match(main, /await walletOperationGate\.waitForIdle\(\)/);
  assert.match(renderer, /if \(walletFormSubmissionInFlight\) return/);
  assert.match(renderer, /setWalletFormBusy\(true\)/);
  const summary = main.slice(main.indexOf('async function loadSummary('), main.indexOf('async function makeWindow()'));
  assert.match(summary, /loadAccountsForSession\(activeWallet, sessionId\)/);
  assert.match(summary, /loadAddressBookForSession\(activeWallet, sessionId\)/);
  assert.match(summary, /walletSessionId: sessionId/);
  assert.match(renderer, /if \(sessionId < renderedWalletSessionId\) return false/);
});

test('release verification docs disclose checksum limitations and audit status', () => {
  const security = read('SECURITY.md');
  const verify = read('VERIFY_RELEASE.md');
  assert.match(security, /independent security audit/i);
  assert.match(verify, /does not prove/i);
  assert.match(verify, /not Authenticode-signed/i);
  assert.doesNotMatch(read('.github/workflows/release.yml'), /josimi\.exe/);
  assert.doesNotMatch(verify, /josimi\.exe/);
  assert.match(verify, /\$version = '1\.2\.11'/);
  assert.match(verify, /Split-Path \$zip -Leaf/);
});
