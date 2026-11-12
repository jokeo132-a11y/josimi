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
  waitForRpcReady,
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

function createGate() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('local wallet operations wait for responsive RPC, not only a spawned daemon', async () => {
  let checks = 0;
  const ready = await waitForRpcReady(async () => {
    checks += 1;
    return { running: true, rpc: { state: checks < 3 ? 'stopped' : 'syncing', synchronized: false } };
  }, { timeoutMs: 100, intervalMs: 5, delay: async () => {} });
  assert.equal(checks, 3);
  assert.equal(ready.rpc.state, 'syncing');
});

test('local RPC readiness fails promptly if monerod exits and times out when RPC never answers', async () => {
  await assert.rejects(waitForRpcReady(async () => ({ running: false }), { timeoutMs: 10, delay: async () => {} }), /LOCAL_NODE_EXITED/);
  let clock = 0;
  await assert.rejects(waitForRpcReady(async () => ({ running: true, rpc: { state: 'stopped' } }), {
    timeoutMs: 10, intervalMs: 5, now: () => clock, delay: async (ms) => { clock += ms; }
  }), /LOCAL_NODE_RPC_TIMEOUT/);
});

test('local RPC readiness rejects ambiguous states but accepts a syncing RPC', async () => {
  let clock = 0;
  await assert.rejects(waitForRpcReady(async () => ({ running: true, rpc: { state: 'local', synchronized: null } }), {
    timeoutMs: 10, intervalMs: 5, now: () => clock, delay: async (ms) => { clock += ms; }
  }), /LOCAL_NODE_RPC_TIMEOUT/);
  clock = 0;
  const syncing = await waitForRpcReady(async () => ({ running: true, rpc: { state: 'syncing', synchronized: false } }), {
    timeoutMs: 10, intervalMs: 5, now: () => clock, delay: async (ms) => { clock += ms; }
  });
  assert.equal(syncing.rpc.synchronized, false);
});

test('local RPC readiness rejects a ready response that arrives after the deadline', async () => {
  let clock = 0;
  await assert.rejects(waitForRpcReady(async () => {
    clock = 11;
    return { running: true, rpc: { state: 'synced', synchronized: true } };
  }, { timeoutMs: 10, now: () => clock }), /LOCAL_NODE_RPC_TIMEOUT/);
});

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
  assert.ok(args.includes('--sync-pruned-blocks'));
  assert.ok(!args.includes('--db-sync-mode'), 'use the exact Monero v0.18.5.4 default staged sync behavior');
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
    assert.deepEqual(spawnDetails.options.stdio, ['pipe', 'ignore', 'ignore']);
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
  const releaseVerification = createGate();
  const verificationEntered = createGate();
  let spawnCount = 0;
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, spawnProcess: () => { spawnCount += 1; throw new Error('unexpected spawn'); } });
  const verify = manager._verifyBundledRuntime.bind(manager);
  manager._verifyBundledRuntime = async () => {
    verificationEntered.resolve();
    await releaseVerification.promise;
    return verify();
  };
  try {
    const startPromise = manager.start();
    await verificationEntered.promise;
    const stopPromise = manager.stop();
    releaseVerification.resolve();
    await stopPromise;
    await startPromise;
    assert.equal(spawnCount, 0);
    assert.equal(manager.getStatus().running, false);
  } finally {
    releaseVerification.resolve();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('stopping after verification but during data-directory creation prevents the monerod spawn', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-mkdir-race-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const releaseDirectory = createGate();
  const directoryEntered = createGate();
  let spawnCount = 0;
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, spawnProcess: () => { spawnCount += 1; throw new Error('unexpected spawn'); } });
  manager._ensureDataDirectory = async () => {
    directoryEntered.resolve();
    await releaseDirectory.promise;
  };
  try {
    const startPromise = manager.start();
    await directoryEntered.promise;
    const stopPromise = manager.stop();
    releaseDirectory.resolve();
    await stopPromise;
    await startPromise;
    assert.equal(spawnCount, 0);
    assert.equal(manager.getStatus().running, false);
  } finally {
    releaseDirectory.resolve();
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
    assert.equal(manager.child, null);
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


test('concurrent monerod start requests share one spawn while startup is pending', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-start-coalesce-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const spawnEntered = createGate();
  const allowSpawn = createGate();
  const child = createChild();
  let spawnCount = 0;
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, spawnProcess: () => {
    spawnCount += 1;
    spawnEntered.resolve();
    allowSpawn.promise.then(() => child.emit('spawn'));
    return child;
  } });
  try {
    const first = manager.start();
    await spawnEntered.promise;
    const second = manager.start();
    allowSpawn.resolve();
    const [a, b] = await Promise.all([first, second]);
    assert.equal(spawnCount, 1);
    assert.equal(a.running, true);
    assert.equal(b.running, true);
    await manager.stop(async () => { child.exitCode = 0; child.emit('close', 0, null); });
  } finally {
    allowSpawn.resolve();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('stopping during the spawn handshake cancels promptly and reaps the child', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-stop-spawn-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const spawnEntered = createGate();
  const child = createChild();
  child.kill = (signal) => {
    child.exitCode = signal === 'SIGKILL' ? 1 : 0;
    setImmediate(() => child.emit('close', child.exitCode, signal || null));
    return true;
  };
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, startTimeoutMs: 5_000, closeTimeoutMs: 100, spawnProcess: () => { spawnEntered.resolve(); return child; } });
  try {
    const pendingStart = manager.start();
    await spawnEntered.promise;
    const startedAt = Date.now();
    await manager.stop();
    await pendingStart;
    assert.ok(Date.now() - startedAt < 1_000, 'stop should not wait for the spawn timeout');
    assert.equal(manager.getStatus().running, false);
    assert.equal(manager.getStatus().restarting, false);
    assert.equal(manager.child, null);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('unexpected daemon exit triggers bounded automatic recovery; explicit stop disables it', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-auto-restart-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const children = [];
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, restartBaseDelayMs: 5, restartMaxDelayMs: 5, restartMaxAttempts: 2, stableRuntimeMs: 60_000, spawnProcess: () => {
    const child = createChild();
    children.push(child);
    setImmediate(() => child.emit('spawn'));
    return child;
  } });
  try {
    await manager.start();
    children[0].exitCode = 1;
    children[0].emit('close', 1, null);
    assert.equal(manager.getStatus().restarting, true);
    const deadline = Date.now() + 1_000;
    while (children.length < 2 && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(children.length, 2, 'an unexpected exit should restart the bundled daemon');
    assert.equal(manager.getStatus().running, true);
    await manager.stop(async () => { children[1].exitCode = 0; children[1].emit('close', 0, null); });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(children.length, 2, 'a user-requested stop must not be undone by recovery');
    assert.equal(manager.getStatus().restarting, false);
  } finally {
    if (manager.isRunning()) await manager.stop();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('RPC readiness waits while the real manager is starting an automatic daemon restart', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-restart-starting-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const allowRestartSpawn = createGate();
  let restartSpawned = false;
  const children = [];
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, restartBaseDelayMs: 5, restartMaxDelayMs: 5, spawnProcess: () => {
    const child = createChild();
    children.push(child);
    if (children.length === 1) setImmediate(() => child.emit('spawn'));
    else {
      allowRestartSpawn.promise.then(() => { restartSpawned = true; child.emit('spawn'); });
    }
    return child;
  } });
  let settled = false;
  try {
    await manager.start();
    children[0].exitCode = 1;
    children[0].emit('close', 1, null);
    const spawnDeadline = Date.now() + 1_000;
    while (children.length < 2 && Date.now() < spawnDeadline) await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(children.length, 2, 'the automatic restart should enter its spawn phase');
    assert.equal(manager.getStatus().restarting, true);
    const ready = waitForRpcReady(async () => {
      const status = manager.getStatus();
      return { ...status, rpc: { state: restartSpawned ? 'syncing' : 'stopped', synchronized: restartSpawned } };
    }, { timeoutMs: 1_000, intervalMs: 5 });
    const observed = ready.then((status) => { settled = true; return { status }; }, (error) => { settled = true; return { error }; });
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(settled, false, 'readiness should wait through verification/spawn, not report a permanent exit');
    allowRestartSpawn.resolve();
    const outcome = await observed;
    assert.equal(outcome.error, undefined);
    assert.equal(outcome.status.running, true);
    assert.equal(outcome.status.rpc.state, 'syncing');
  } finally {
    allowRestartSpawn.resolve();
    await manager.stop(async () => {
      if (manager.child) { manager.child.exitCode = 0; manager.child.emit('close', 0, null); }
    });
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('RPC readiness waits through an automatic restart without treating it as a permanent exit', async () => {
  const states = [
    { running: true, rpc: { state: 'starting', synchronized: null } },
    { running: false, restarting: true, rpc: { state: 'stopped', synchronized: null } },
    { running: true, rpc: { state: 'syncing', synchronized: true } }
  ];
  let checks = 0;
  const result = await waitForRpcReady(async () => states[checks++], { timeoutMs: 100, intervalMs: 1, delay: async () => {} });
  assert.equal(checks, 3);
  assert.equal(result.rpc.state, 'syncing');
});

test('RPC readiness has a strict deadline even when a status request never resolves', async () => {
  const startedAt = Date.now();
  await assert.rejects(waitForRpcReady(() => new Promise(() => {}), { timeoutMs: 20 }), /LOCAL_NODE_RPC_TIMEOUT/);
  assert.ok(Date.now() - startedAt < 500, 'a hung status request should be bounded by the readiness deadline');
});


test('automatic daemon recovery stops after its bounded retry budget is exhausted', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-restart-budget-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const children = [];
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, restartBaseDelayMs: 2, restartMaxDelayMs: 2, restartMaxAttempts: 2, stableRuntimeMs: 60_000, spawnProcess: () => {
    const child = createChild();
    children.push(child);
    setImmediate(() => child.emit('spawn'));
    return child;
  } });
  const waitForCount = async (count) => {
    const deadline = Date.now() + 1_000;
    while (children.length < count && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 2));
    assert.equal(children.length, count);
  };
  try {
    await manager.start();
    for (let index = 0; index < 3; index += 1) {
      children[index].exitCode = 1;
      children[index].emit('close', 1, null);
      if (index < 2) await waitForCount(index + 2);
    }
    assert.equal(manager.getStatus().restartExhausted, true);
    assert.equal(manager.getStatus().restarting, false);
    assert.equal(manager.autoRestartEnabled, false);
    assert.equal(children.length, 3, 'initial start plus exactly two restart attempts are allowed');
  } finally {
    if (manager.isRunning()) await manager.stop();
    await fs.rm(root, { recursive: true, force: true });
  }
});


test('failed spawn rejects cleanly and does not leave a stale child handle', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-spawn-error-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const child = createChild();
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, spawnProcess: () => {
    setImmediate(() => {
      child.emit('error', new Error('spawn failed'));
      child.exitCode = 1;
      child.emit('close', 1, null);
    });
    return child;
  } });
  try {
    await assert.rejects(manager.start(), /monerod를 실행하지 못했습니다/);
    assert.equal(manager.child, null);
    assert.equal(manager.getStatus().running, false);
    assert.equal(manager.getStatus().restarting, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('explicit stop during automatic-restart backoff cancels the queued respawn', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-node-stop-backoff-'));
  const bundledRuntimeDir = await createRuntimeBundle(root);
  const children = [];
  const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir, restartBaseDelayMs: 50, restartMaxDelayMs: 50, spawnProcess: () => {
    const child = createChild();
    children.push(child);
    setImmediate(() => child.emit('spawn'));
    return child;
  } });
  try {
    await manager.start();
    children[0].exitCode = 1;
    children[0].emit('close', 1, null);
    assert.equal(manager.getStatus().restarting, true);
    await manager.stop();
    await new Promise((resolve) => setTimeout(resolve, 75));
    assert.equal(children.length, 1);
    assert.equal(manager.getStatus().restarting, false);
    assert.equal(manager.getStatus().running, false);
  } finally {
    if (manager.isRunning()) await manager.stop();
    await fs.rm(root, { recursive: true, force: true });
  }
});
