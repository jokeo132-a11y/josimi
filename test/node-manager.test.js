const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  MONERO_VERSION,
  MONERO_ARCHIVE_URL,
  MONERO_ARCHIVE_SHA256,
  RPC_HOST,
  RPC_PORT,
  ZMQ_PORT,
  buildMonerodArgs,
  LocalNodeManager
} = require('../src/node-manager');

test('Monero CLI download is pinned to the official HTTPS archive and digest', () => {
  const url = new URL(MONERO_ARCHIVE_URL);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'downloads.getmonero.org');
  assert.match(url.pathname, new RegExp(`monero-win-x64-v${MONERO_VERSION.replaceAll('.', '\\.') }\\.zip$`));
  assert.match(MONERO_ARCHIVE_SHA256, /^[a-f0-9]{64}$/);
});

test('monerod binds administrative RPC and ZMQ to loopback, prunes, and disables UPnP', () => {
  assert.equal(RPC_HOST, '127.0.0.1');
  const args = buildMonerodArgs(path.join(os.tmpdir(), 'josimi-node-data'), path.join(os.tmpdir(), 'monerod.log'));
  const valueFor = (flag) => args[args.indexOf(flag) + 1];
  assert.equal(valueFor('--rpc-bind-ip'), '127.0.0.1');
  assert.equal(valueFor('--rpc-bind-port'), String(RPC_PORT));
  assert.equal(valueFor('--zmq-pub'), `tcp://127.0.0.1:${ZMQ_PORT}`);
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

test('stopping during local-node extraction cancels startup before spawning monerod', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-start-race-'));
  const manager = new LocalNodeManager({ root, platform: 'win32' });
  await fs.mkdir(path.dirname(manager.archivePath), { recursive: true });
  await fs.writeFile(manager.archivePath, 'test archive marker');
  let releaseExtraction;
  let extractionEntered = false;
  manager._extractVerifiedBinary = async () => {
    extractionEntered = true;
    await new Promise((resolve) => { releaseExtraction = resolve; });
    manager.activeDir = path.join(manager.runtimeDir, 'active-test');
    await fs.mkdir(manager.activeDir, { recursive: true });
    return path.join(manager.activeDir, 'monerod.exe');
  };
  try {
    const startPromise = manager.start();
    for (let i = 0; i < 50 && !extractionEntered; i += 1) await new Promise((resolve) => setImmediate(resolve));
    assert.equal(extractionEntered, true);
    assert.equal(manager.getStatus().starting, true);
    const stopPromise = manager.stop();
    releaseExtraction();
    await stopPromise;
    await startPromise;
    assert.equal(manager.isRunning(), false);
    assert.equal(manager.getStatus().starting, false);
    assert.equal(manager.activeDir, null);
  } finally {
    if (releaseExtraction) releaseExtraction();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('stopping after extraction but during data-directory creation prevents the monerod spawn', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-mkdir-race-'));
  let spawnCount = 0;
  const manager = new LocalNodeManager({ root, platform: 'win32', spawnProcess: () => { spawnCount += 1; throw new Error('unexpected spawn'); } });
  await fs.mkdir(path.dirname(manager.archivePath), { recursive: true });
  await fs.writeFile(manager.archivePath, 'test archive marker');
  let releaseDirectory;
  let directoryEntered = false;
  manager._extractVerifiedBinary = async () => {
    manager.activeDir = path.join(manager.runtimeDir, 'active-test');
    await fs.mkdir(manager.activeDir, { recursive: true });
    return path.join(manager.activeDir, 'monerod.exe');
  };
  manager._ensureDataDirectory = async () => {
    directoryEntered = true;
    await new Promise((resolve) => { releaseDirectory = resolve; });
  };
  try {
    const startPromise = manager.start();
    for (let i = 0; i < 50 && !directoryEntered; i += 1) await new Promise((resolve) => setImmediate(resolve));
    assert.equal(directoryEntered, true);
    const stopPromise = manager.stop();
    releaseDirectory();
    await stopPromise;
    await startPromise;
    assert.equal(spawnCount, 0);
    assert.equal(manager.activeDir, null);
    assert.equal(manager.isRunning(), false);
  } finally {
    if (releaseDirectory) releaseDirectory();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('stopping during local-node installation aborts the download and removes the partial archive', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-install-cancel-'));
  const manager = new LocalNodeManager({ root, platform: 'win32' });
  manager._downloadArchive = async (destination, _onProgress, signal) => {
    await fs.writeFile(destination, 'partial archive');
    if (signal.aborted) throw new Error('Monero CLI 다운로드가 취소되었습니다.');
    await new Promise((resolve, reject) => {
      const onAbort = () => reject(new Error('Monero CLI 다운로드가 취소되었습니다.'));
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
  };
  try {
    const installPromise = manager.install();
    const partial = `${manager.archivePath}.part`;
    for (let i = 0; i < 50 && !(await fs.access(partial).then(() => true, () => false)); i += 1) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    assert.equal(await fs.access(partial).then(() => true, () => false), true);
    const stopPromise = manager.stop();
    await assert.rejects(installPromise, /취소/);
    await stopPromise;
    assert.equal(await fs.access(partial).then(() => true, () => false), false);
    assert.equal(manager.getStatus().downloading, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
