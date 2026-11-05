'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const os = require('node:os');
const path = require('node:path');
const {
  MONERO_VERSION,
  MONERO_ARCHIVE_URL,
  MONERO_ARCHIVE_SHA256,
  MONERO_MANIFEST,
  MONERO_DAEMON,
  RPC_HOST,
  RPC_PORT,
  isAllowedRuntimeName,
  buildMonerodArgs,
  LocalNodeManager
} = require('../src/node-manager');

function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }

async function createRuntimeBundle(parent) {
  const directory = path.join(parent, 'runtime', 'monero');
  await fs.mkdir(directory, { recursive: true });
  const contents = new Map([
    ['monerod.exe', Buffer.from('unmodified upstream daemon fixture')],
    ['libwallet.dll', Buffer.from('required runtime library fixture')],
    ['MONERO-LICENSE.txt', Buffer.from('upstream license fixture')],
    ['UPSTREAM-NOTICE.txt', Buffer.from('upstream notice fixture')]
  ]);
  for (const [name, data] of contents) await fs.writeFile(path.join(directory, name), data);
  const manifest = {
    schemaVersion: 1,
    project: 'monero-project/monero',
    version: MONERO_VERSION,
    sourceArchive: `monero-win-x64-v${MONERO_VERSION}.zip`,
    sourceArchiveSha256: MONERO_ARCHIVE_SHA256,
    files: [...contents].map(([name, data]) => ({ name, sha256: sha256(data) })).sort((a, b) => a.name.localeCompare(b.name))
  };
  await fs.writeFile(path.join(directory, MONERO_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return directory;
}

function createChild() {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  child.pid = 4321;
  child.kill = (signal) => {
    child.exitCode = signal === 'SIGKILL' ? 1 : 0;
    setImmediate(() => child.emit('close', child.exitCode, signal || null));
    return true;
  };
  return child;
}

async function waitUntil(predicate) {
  for (let i = 0; i < 100 && !predicate(); i += 1) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(predicate(), true, 'expected condition did not become true');
}

test('Monero build input is pinned to the official HTTPS CLI archive and a fixed SHA-256', () => {
  const url = new URL(MONERO_ARCHIVE_URL);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'downloads.getmonero.org');
  assert.match(url.pathname, new RegExp(`monero-win-x64-v${MONERO_VERSION.replaceAll('.', '\\.') }\\.zip$`));
  assert.match(MONERO_ARCHIVE_SHA256, /^[a-f0-9]{64}$/);
});

test('runtime filename allowlist permits only monerod, DLLs and the two notices', () => {
  assert.equal(isAllowedRuntimeName('monerod.exe'), true);
  assert.equal(isAllowedRuntimeName('MONEROD.EXE'), false);
  assert.equal(isAllowedRuntimeName('libwallet.dll'), true);
  assert.equal(isAllowedRuntimeName('MONERO-LICENSE.txt'), true);
  assert.equal(isAllowedRuntimeName('UPSTREAM-NOTICE.txt'), true);
  for (const name of ['monero-wallet-cli.exe', '../monerod.exe', 'nested/monerod.exe', 'payload.zip', 'other.txt']) {
    assert.equal(isAllowedRuntimeName(name), false, name);
  }
});

test('monerod binds administrative RPC to loopback, prunes, and disables UPnP', () => {
  assert.equal(RPC_HOST, '127.0.0.1');
  const args = buildMonerodArgs(path.join(os.tmpdir(), 'josimi-node-data'), path.join(os.tmpdir(), 'monerod.log'));
  const valueFor = (flag) => args[args.indexOf(flag) + 1];
  assert.equal(valueFor('--rpc-bind-ip'), '127.0.0.1');
  assert.equal(valueFor('--rpc-bind-port'), String(RPC_PORT));
  assert.ok(!args.includes('--zmq-pub'));
  assert.ok(args.includes('--prune-blockchain'));
  assert.ok(args.includes('--no-igd'));
  assert.ok(args.includes('--hide-my-port'));
  assert.ok(!args.includes('0.0.0.0'));
  assert.ok(!args.includes('--rpc-bind-any'));
});

test('local daemon manager reports unsupported platforms without starting processes', async () => {
  const manager = new LocalNodeManager({ root: path.join(os.tmpdir(), 'josimi-test-node'), platform: 'linux' });
  assert.equal(manager.getStatus().supported, false);
  assert.equal(manager.getStatus().running, false);
  await assert.rejects(manager.install(), /Windows/);
  await assert.rejects(manager.start(), /Windows/);
});

test('bundled daemon runtime is hash-verified offline and no CLI archive is downloaded at runtime', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-bundle-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir });
  try {
    assert.equal(manager.getStatus().installed, true);
    assert.equal(manager.getStatus().bundled, true);
    assert.equal(manager.getStatus().downloading, false);
    assert.equal(typeof manager._downloadArchive, 'undefined');
    const result = await manager.install();
    assert.equal(result.installed, true);
    assert.equal(result.bundled, true);
    assert.equal(result.version, MONERO_VERSION);
    assert.equal(result.binaryPath, path.join(bundledRuntimeDir, MONERO_DAEMON));
    assert.equal(manager.getStatus().installing, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('bundled runtime fails closed when the archive pin, a file hash, or folder contents differ', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-bundle-bad-'));
  try {
    const wrongPinDir = await createRuntimeBundle(root);
    const wrongPin = new LocalNodeManager({ root: path.join(root, 'user-a'), platform: 'win32', bundledRuntimeDir: wrongPinDir, archiveSha256: '0'.repeat(64) });
    await assert.rejects(wrongPin.install(), /archive 해시/);

    const tamperDir = await createRuntimeBundle(root);
    await fs.writeFile(path.join(tamperDir, MONERO_DAEMON), 'tampered daemon');
    const tampered = new LocalNodeManager({ root: path.join(root, 'user-b'), platform: 'win32', bundledRuntimeDir: tamperDir });
    await assert.rejects(tampered.install(), /파일 SHA-256/);

    const extraDir = await createRuntimeBundle(root);
    await fs.writeFile(path.join(extraDir, 'monero-wallet-cli.exe'), 'not allowed');
    const extra = new LocalNodeManager({ root: path.join(root, 'user-c'), platform: 'win32', bundledRuntimeDir: extraDir });
    await assert.rejects(extra.install(), /manifest에 없는 파일/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('monerod starts from the bundled daemon directory as a hidden process', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-start-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const child = createChild();
  let spawnDetails;
  const manager = new LocalNodeManager({
    root: path.join(root, 'user-data'),
    platform: 'win32',
    bundledRuntimeDir,
    spawnProcess: (binary, args, options) => {
      spawnDetails = { binary, args, options };
      setImmediate(() => child.emit('spawn'));
      return child;
    }
  });
  try {
    const status = await manager.start();
    assert.equal(status.running, true);
    assert.equal(spawnDetails.binary, path.join(bundledRuntimeDir, MONERO_DAEMON));
    assert.equal(spawnDetails.options.cwd, bundledRuntimeDir);
    assert.equal(spawnDetails.options.windowsHide, true);
    assert.equal(spawnDetails.options.stdio, 'ignore');
    assert.equal(spawnDetails.args[spawnDetails.args.indexOf('--rpc-bind-ip') + 1], '127.0.0.1');
    assert.equal(await fs.stat(manager.dataDir).then((stat) => stat.isDirectory()), true);
    await manager.stop(async () => {
      child.exitCode = 0;
      child.emit('close', 0, null);
    });
    assert.equal(manager.getStatus().running, false);
  } finally {
    if (manager.isRunning()) await manager.stop();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('stopping while bundle verification is pending prevents monerod from spawning', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-verify-race-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  let releaseVerification;
  let verificationEntered = false;
  let spawnCount = 0;
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, spawnProcess: () => { spawnCount += 1; throw new Error('unexpected spawn'); } });
  const verify = manager._verifyBundledRuntime.bind(manager);
  manager._verifyBundledRuntime = async () => {
    verificationEntered = true;
    await new Promise((resolve) => { releaseVerification = resolve; });
    return verify();
  };
  try {
    const startPromise = manager.start();
    await waitUntil(() => verificationEntered);
    const stopPromise = manager.stop();
    releaseVerification();
    await stopPromise;
    await startPromise;
    assert.equal(spawnCount, 0);
    assert.equal(manager.getStatus().running, false);
  } finally {
    if (releaseVerification) releaseVerification();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('stopping after verification but during data-directory creation prevents the monerod spawn', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-mkdir-race-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  let releaseDirectory;
  let directoryEntered = false;
  let spawnCount = 0;
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, spawnProcess: () => { spawnCount += 1; throw new Error('unexpected spawn'); } });
  manager._ensureDataDirectory = async () => {
    directoryEntered = true;
    await new Promise((resolve) => { releaseDirectory = resolve; });
  };
  try {
    const startPromise = manager.start();
    await waitUntil(() => directoryEntered);
    const stopPromise = manager.stop();
    releaseDirectory();
    await stopPromise;
    await startPromise;
    assert.equal(spawnCount, 0);
    assert.equal(manager.getStatus().running, false);
  } finally {
    if (releaseDirectory) releaseDirectory();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('unexpected monerod close clears the process handle and records its exit', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-unexpected-close-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const child = createChild();
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, spawnProcess: () => { setImmediate(() => child.emit('spawn')); return child; } });
  try {
    await manager.start();
    assert.equal(manager.getStatus().running, true);
    child.exitCode = 1;
    child.emit('close', 1, null);
    await waitUntil(() => manager.child === null);
    assert.equal(manager.getStatus().running, false);
    assert.equal(manager.getStatus().lastExit.code, 1);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('source contains no runtime archive downloader or ZIP extraction path', async () => {
  const source = await fs.readFile(path.join(__dirname, '..', 'src', 'node-manager.js'), 'utf8');
  assert.doesNotMatch(source, /require\('node:https'\)/);
  assert.doesNotMatch(source, /downloadOfficialArchive|runPowerShellExtraction|Expand-Archive/);
  assert.match(source, /bundledRuntimeDir/);
  assert.match(source, /sha256File\(filePath\)/);
});
