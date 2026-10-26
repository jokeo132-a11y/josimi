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
  assert.ok(miningPrivacyLines.every((line) => /--wallet/.test(line) && /-u/.test(line)));
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
  assert.match(privacy, /probes to all configured candidates in parallel/);
  assert.match(privacy, /The P2Pool peer listener binds to all network interfaces/);
  assert.match(privacy, /does \*\*not\*\* stop the daemon from listening on its default P2P port/);
  assert.match(privacy, /Incoming reachability therefore also depends on the computer's firewall/);
  assert.match(readme, /daemon still listens on its Monero P2P port; inbound reachability depends on the computer's firewall/);
  assert.match(privacy, /fresh current-wallet-password check/);
  assert.match(privacy, /temporary in-memory wallet/);
  assert.match(privacy, /cannot be guaranteed physically zeroized/);
  assert.match(privacy, /XMRig also receives that same public address as `-u`/);
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
  assert.doesNotMatch(release.split('jobs:')[0], /contents:\s*write/);
  for (const workflow of [release, ci]) {
    for (const line of workflow.split('\n').filter((entry) => /^\s*uses: actions\//.test(entry))) {
      assert.match(line, /@[a-f0-9]{40}\s+# v\d/);
    }
  }
  assert.match(release, /sha256sum --check SHA256SUMS\.txt/);
  assert.match(release, /build\.log > SHA256SUMS\.txt/);
  assert.match(release, /rev-list -n 1/);
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
  assert.match(verify, /josimi-1\.2\.0-x64\.zip/);
});
