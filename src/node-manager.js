'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');

const MONERO_VERSION = '0.18.5.4';
const MONERO_ARCHIVE_URL = `https://downloads.getmonero.org/cli/monero-win-x64-v${MONERO_VERSION}.zip`;
const MONERO_ARCHIVE_SHA256 = '1ccac3b476ba75bf6dfdfa848f6520a79b64cdf3457a160eaa0dad82d5a2a042';
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MONERO_MANIFEST = 'manifest.json';
const MONERO_DAEMON = 'monerod.exe';
const closedChildren = new WeakSet();
const RPC_HOST = '127.0.0.1';
const RPC_PORT = 18081;

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);
    input.on('data', (chunk) => hash.update(chunk));
    input.once('error', reject);
    input.once('end', () => resolve(hash.digest('hex')));
  });
}

function isAllowedRuntimeName(name) {
  if (typeof name !== 'string' || name.length < 1 || name.length > 128 || path.basename(name) !== name || /[\\/:\0]/.test(name)) return false;
  if (name === MONERO_DAEMON) return true;
  if (name === 'MONERO-LICENSE.txt' || name === 'UPSTREAM-NOTICE.txt') return true;
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,123}\.dll$/i.test(name);
}

function buildMonerodArgs(dataDir, logFile) {
  return [
    '--data-dir', dataDir,
    '--prune-blockchain',
    '--db-sync-mode', 'safe:sync',
    '--rpc-bind-ip', RPC_HOST,
    '--rpc-bind-port', String(RPC_PORT),
    '--hide-my-port',
    '--no-igd',
    '--log-file', logFile
  ];
}

function isRunning(child) {
  return Boolean(child && child.exitCode === null && child.signalCode === null);
}

function waitForClose(child, timeoutMs) {
  if (!child || closedChildren.has(child)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (closed) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.removeListener('close', onClose);
      resolve(closed);
    };
    const onClose = () => { closedChildren.add(child); finish(true); };
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once('close', onClose);
  });
}

class LocalNodeManager extends EventEmitter {
  constructor({ root, platform = process.platform, spawnProcess = spawn, bundledRuntimeDir = null, hashFile = sha256File, archiveSha256 = MONERO_ARCHIVE_SHA256 } = {}) {
    super();
    if (!root || typeof root !== 'string') throw new TypeError('LocalNodeManager requires a data root path.');
    this.root = path.resolve(root);
    this.platform = platform;
    this.bundledRuntimeDir = typeof bundledRuntimeDir === 'string' ? path.resolve(bundledRuntimeDir) : null;
    this.hashFile = hashFile;
    this.archiveSha256 = archiveSha256;
    this.installPromise = null;
    this.startPromise = null;
    this.cancelStart = false;
    this.spawnProcess = spawnProcess;
    this.child = null;
    this.lastExit = null;
    this.lastBundleError = null;
  }

  get dataDir() { return path.join(this.root, 'node'); }
  get binaryPath() { return this.bundledRuntimeDir ? path.join(this.bundledRuntimeDir, MONERO_DAEMON) : null; }
  isRunning() { return isRunning(this.child); }

  _bundlePresent() {
    return Boolean(this.bundledRuntimeDir && fs.existsSync(this.binaryPath) && fs.existsSync(path.join(this.bundledRuntimeDir, MONERO_MANIFEST)));
  }

  getStatus() {
    const bundled = this._bundlePresent();
    return {
      supported: this.platform === 'win32',
      version: MONERO_VERSION,
      installed: bundled,
      bundled,
      downloading: false,
      installing: Boolean(this.installPromise),
      progress: null,
      running: this.isRunning(),
      pid: this.isRunning() ? this.child.pid : null,
      lastExit: this.lastExit,
      bundleError: this.lastBundleError
    };
  }

  emitStatus() { this.emit('status', this.getStatus()); }

  async _verifyBundledRuntime() {
    if (!this.bundledRuntimeDir || !this._bundlePresent()) {
      throw new Error('포함된 monerod 런타임을 찾지 못했습니다. monerod가 포함된 josimi ZIP을 다시 설치하세요. 실행 중 다운로드는 사용하지 않습니다.');
    }
    const rootStat = fs.lstatSync(this.bundledRuntimeDir);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('포함된 Monero 런타임 경로가 안전하지 않습니다.');
    let manifest;
    try { manifest = JSON.parse(await fs.promises.readFile(path.join(this.bundledRuntimeDir, MONERO_MANIFEST), 'utf8')); }
    catch (_) { throw new Error('포함된 monerod 런타임 manifest를 읽을 수 없습니다.'); }
    if (!manifest || manifest.version !== MONERO_VERSION || manifest.sourceArchiveSha256 !== this.archiveSha256 || !Array.isArray(manifest.files) || manifest.files.length < 2 || manifest.files.length > 64) {
      throw new Error('포함된 monerod 런타임 manifest가 예상 버전 또는 공식 archive 해시와 일치하지 않습니다.');
    }
    const expected = new Set();
    let daemonSeen = false;
    for (const record of manifest.files) {
      if (!record || Object.keys(record).sort().join(',') !== 'name,sha256' || !isAllowedRuntimeName(record.name) || !/^[a-f0-9]{64}$/.test(record.sha256) || expected.has(record.name)) {
        throw new Error('포함된 monerod 런타임 manifest에 허용되지 않은 파일 항목이 있습니다.');
      }
      expected.add(record.name);
      if (record.name === MONERO_DAEMON) daemonSeen = true;
      const filePath = path.join(this.bundledRuntimeDir, record.name);
      let stat;
      try { stat = await fs.promises.lstat(filePath); } catch (_) { throw new Error(`포함된 Monero 런타임 파일을 찾지 못했습니다: ${record.name}`); }
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`포함된 Monero 런타임 파일 형식이 안전하지 않습니다: ${record.name}`);
      const actual = await this.hashFile(filePath).catch(() => '');
      if (actual !== record.sha256) throw new Error(`포함된 Monero 런타임 파일 SHA-256이 일치하지 않습니다: ${record.name}`);
    }
    if (!daemonSeen) throw new Error('포함된 Monero 런타임 manifest에 monerod.exe가 없습니다.');
    const actualNames = fs.readdirSync(this.bundledRuntimeDir).sort();
    const expectedNames = [...expected, MONERO_MANIFEST].sort();
    if (actualNames.length !== expectedNames.length || actualNames.some((name, index) => name !== expectedNames[index])) {
      throw new Error('포함된 Monero 런타임 폴더에 manifest에 없는 파일이 있습니다.');
    }
    return this.binaryPath;
  }

  async install() {
    if (this.platform !== 'win32') throw new Error('로컬 Monero 노드는 Windows에서만 지원됩니다.');
    if (this.installPromise) return this.installPromise;
    const operation = this._verifyBundledRuntime().then((binaryPath) => {
      this.lastBundleError = null;
      return { installed: true, bundled: true, version: MONERO_VERSION, binaryPath };
    }).catch((error) => {
      this.lastBundleError = error.message;
      throw error;
    });
    this.installPromise = operation;
    this.emitStatus();
    try { return await operation; }
    finally {
      if (this.installPromise === operation) this.installPromise = null;
      this.emitStatus();
    }
  }

  _ensureDataDirectory() {
    return fs.promises.mkdir(this.dataDir, { recursive: true });
  }

  async start() {
    if (this.platform !== 'win32') throw new Error('로컬 Monero 노드는 Windows에서만 지원됩니다.');
    if (this.isRunning()) return this.getStatus();
    if (this.child && !closedChildren.has(this.child)) throw new Error('이전 monerod 프로세스의 종료 확인이 끝날 때까지 기다리세요.');
    if (this.startPromise) return this.startPromise;
    this.cancelStart = false;
    const operation = this._start();
    this.startPromise = operation;
    this.emitStatus();
    try { return await operation; }
    finally {
      if (this.startPromise === operation) this.startPromise = null;
      this.emitStatus();
    }
  }

  async _start() {
    let child = null;
    try {
      if (this.installPromise) await this.installPromise;
      const binary = await this._verifyBundledRuntime();
      if (this.cancelStart) return this.getStatus();
      await this._ensureDataDirectory();
      if (this.cancelStart) return this.getStatus();
      const logFile = path.join(this.dataDir, 'monerod.log');
      const args = buildMonerodArgs(this.dataDir, logFile);
      child = this.spawnProcess(binary, args, { cwd: path.dirname(binary), windowsHide: true, stdio: 'ignore' });
      this.child = child;
      this.lastExit = null;
      child.once('close', (code, signal) => {
        closedChildren.add(child);
        if (this.child === child) this.child = null;
        this.lastExit = { code, signal, at: Date.now() };
        this.emitStatus();
        this.emit('exit', this.lastExit);
      });
      child.once('error', (error) => {
        this.lastExit = { error: error.message, at: Date.now() };
        this.emitStatus();
        this.emit('exit', this.lastExit);
      });
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error('monerod 프로세스 시작이 10초 안에 확인되지 않았습니다.')); }, 10_000);
        const onSpawn = () => { cleanup(); resolve(); };
        const onError = (error) => { cleanup(); reject(error); };
        const cleanup = () => { clearTimeout(timer); child.removeListener('spawn', onSpawn); child.removeListener('error', onError); };
        child.once('spawn', onSpawn);
        child.once('error', onError);
      }).catch((error) => {
        if (isRunning(child)) child.kill();
        throw new Error(`monerod를 실행하지 못했습니다. (${error.message})`);
      });
      this.emitStatus();
      return this.getStatus();
    } catch (error) {
      if (child && isRunning(child)) { try { child.kill(); } catch (_) {} }
      throw error;
    }
  }

  async stop(requestGracefulStop) {
    this.cancelStart = true;
    const pendingInstall = this.installPromise;
    if (pendingInstall) await pendingInstall.catch(() => {});
    const pendingStart = this.startPromise;
    if (pendingStart) await pendingStart.catch(() => {});
    const child = this.child;
    if (!child || closedChildren.has(child)) {
      this.child = null;
      this.emitStatus();
      return true;
    }
    if (typeof requestGracefulStop === 'function') {
      try { await requestGracefulStop(); } catch (_) {}
    }
    let closed = await waitForClose(child, 15_000);
    if (!closed && isRunning(child)) {
      try { child.kill('SIGTERM'); } catch (_) {}
      closed = await waitForClose(child, 5_000);
    }
    if (!closed && isRunning(child)) {
      try { child.kill('SIGKILL'); } catch (_) {}
      closed = await waitForClose(child, 3_000);
    }
    if (!closed) throw new Error('monerod 종료를 확인하지 못했습니다. 작업 관리자에서 프로세스 상태를 확인하세요.');
    this.child = null;
    this.emitStatus();
    return true;
  }
}

async function waitForRpcReady(readStatus, { timeoutMs = 120_000, intervalMs = 1_200, delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), now = Date.now } = {}) {
  if (typeof readStatus !== 'function') throw new TypeError('waitForRpcReady requires a status reader.');
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    const status = await readStatus();
    if (!status?.running) throw new Error('LOCAL_NODE_EXITED');
    if (now() >= deadline) throw new Error('LOCAL_NODE_RPC_TIMEOUT');
    if (status.rpc && !['stopped', 'starting', 'offline'].includes(status.rpc.state)) return status;
    await delay(Math.min(intervalMs, Math.max(0, deadline - now())));
  }
  throw new Error('LOCAL_NODE_RPC_TIMEOUT');
}

module.exports = {
  MONERO_VERSION,
  MONERO_ARCHIVE_URL,
  MONERO_ARCHIVE_SHA256,
  MAX_ARCHIVE_BYTES,
  MONERO_MANIFEST,
  MONERO_DAEMON,
  RPC_HOST,
  RPC_PORT,
  sha256File,
  isAllowedRuntimeName,
  buildMonerodArgs,
  waitForRpcReady,
  LocalNodeManager
};
