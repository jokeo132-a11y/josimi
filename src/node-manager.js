'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');

const MONERO_VERSION = '0.18.5.4';
const MONERO_ARCHIVE_URL = `https://downloads.getmonero.org/cli/monero-win-x64-v${MONERO_VERSION}.zip`;
const MONERO_ARCHIVE_SHA256 = '1ccac3b476ba75bf6dfdfa848f6520a79b64cdf3457a160eaa0dad82d5a2a042';
const MONERO_DOWNLOAD_HOST = 'downloads.getmonero.org';
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const DOWNLOAD_IDLE_TIMEOUT_MS = 30_000;
const DOWNLOAD_TOTAL_TIMEOUT_MS = 15 * 60 * 1000;
const RPC_HOST = '127.0.0.1';
const RPC_PORT = 18081;
const ZMQ_PORT = 18083;

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);
    input.on('data', (chunk) => hash.update(chunk));
    input.once('error', reject);
    input.once('end', () => resolve(hash.digest('hex')));
  });
}

function findFile(root, filename) {
  if (!fs.existsSync(root)) return null;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) return candidate;
    if (entry.isDirectory()) {
      const found = findFile(candidate, filename);
      if (found) return found;
    }
  }
  return null;
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildMonerodArgs(dataDir, logFile) {
  return [
    '--data-dir', dataDir,
    '--prune-blockchain',
    '--db-sync-mode', 'safe:sync',
    '--rpc-bind-ip', RPC_HOST,
    '--rpc-bind-port', String(RPC_PORT),
    '--zmq-pub', `tcp://${RPC_HOST}:${ZMQ_PORT}`,
    '--hide-my-port',
    '--no-igd',
    '--log-file', logFile
  ];
}

function downloadOfficialArchive(destination, onProgress = () => {}, signal) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let activeRequest = null;
    let activeOutput = null;
    let activeResponse = null;
    let activeTransferError = null;
    const failTransfer = (error) => {
      if (settled || activeTransferError) return;
      activeTransferError = error;
      if (activeResponse && !activeResponse.destroyed) activeResponse.destroy();
      if (activeOutput && !activeOutput.closed) {
        activeOutput.once('close', () => finish(activeTransferError));
        activeOutput.destroy();
      } else {
        finish(activeTransferError);
      }
    };
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      error ? reject(error) : resolve(result);
    };
    const onAbort = () => {
      const error = new Error('Monero CLI 다운로드가 취소되었습니다.');
      if (activeRequest) activeRequest.destroy(error);
      else finish(error);
    };
    if (signal?.aborted) return finish(new Error('Monero CLI 다운로드가 취소되었습니다.'));
    signal?.addEventListener('abort', onAbort, { once: true });

    const requestUrl = (url, redirects = 0) => {
      let parsed;
      try { parsed = new URL(url); } catch (_) { return finish(new Error('Monero 다운로드 URL이 올바르지 않습니다.')); }
      if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== MONERO_DOWNLOAD_HOST) {
        return finish(new Error('공식 Monero 다운로드 호스트가 아닌 연결을 차단했습니다.'));
      }
      if (redirects > MAX_REDIRECTS) return finish(new Error('Monero 다운로드 리디렉션이 너무 많습니다.'));

      const request = https.get(parsed, { headers: { 'User-Agent': 'josimi-local-node-installer' } }, (response) => {
        activeResponse = response;
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
          const nextUrl = new URL(response.headers.location, parsed).toString();
          response.resume();
          let next;
          try { next = new URL(nextUrl); } catch (_) { return finish(new Error('Monero 다운로드 리디렉션 URL이 올바르지 않습니다.')); }
          if (next.protocol !== 'https:' || next.hostname.toLowerCase() !== MONERO_DOWNLOAD_HOST || next.username || next.password) {
            return finish(new Error('허용되지 않은 Monero 다운로드 리디렉션을 차단했습니다.'));
          }
          return requestUrl(nextUrl, redirects + 1);
        }
        if (response.statusCode !== 200) {
          response.resume();
          return finish(new Error(`Monero 다운로드 서버가 HTTP ${response.statusCode}를 반환했습니다.`));
        }
        const declaredLength = Number(response.headers['content-length'] || 0);
        if (declaredLength > MAX_ARCHIVE_BYTES) {
          response.destroy();
          return finish(new Error('Monero CLI 압축 파일 크기가 허용 한도를 초과했습니다.'));
        }
        let received = 0;
        let output;
        let hash = crypto.createHash('sha256');
        try { output = fs.createWriteStream(destination, { flags: 'wx' }); } catch (error) { response.destroy(); return finish(error); }
        activeOutput = output;
        response.on('data', (chunk) => {
          if (settled) return;
          received += chunk.length;
          if (received > MAX_ARCHIVE_BYTES) return failTransfer(new Error('Monero CLI 압축 파일 크기가 허용 한도를 초과했습니다.'));
          hash.update(chunk);
          try { onProgress({ received, total: declaredLength || null, progress: declaredLength ? Math.min(100, Math.floor(received * 100 / declaredLength)) : null }); } catch (_) {}
        });
        response.once('error', failTransfer);
        output.once('error', failTransfer);
        output.once('finish', () => output.close((error) => {
          if (error) return failTransfer(error);
          if (declaredLength && received !== declaredLength) return finish(new Error('Monero CLI 다운로드 크기가 서버 선언과 일치하지 않습니다.'));
          finish(null, { sha256: hash.digest('hex'), bytes: received });
        }));
        response.pipe(output);
      });
      activeRequest = request;
      const totalTimer = setTimeout(() => request.destroy(new Error('Monero CLI 다운로드가 15분 제한을 초과했습니다.')), DOWNLOAD_TOTAL_TIMEOUT_MS);
      request.setTimeout(DOWNLOAD_IDLE_TIMEOUT_MS, () => request.destroy(new Error('Monero 다운로드 연결이 30초 동안 응답하지 않았습니다.')));
      request.once('error', failTransfer);
      request.once('close', () => clearTimeout(totalTimer));
    };

    requestUrl(MONERO_ARCHIVE_URL);
  });
}

function runPowerShellExtraction(zipPath, destination) {
  return new Promise((resolve, reject) => {
    const command = `$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath ${quotePowerShell(zipPath)} -DestinationPath ${quotePowerShell(destination)} -Force`;
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, stdio: 'ignore' });
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      error ? reject(error) : resolve();
    };
    const timer = setTimeout(() => { try { child.kill(); } catch (_) {} finish(new Error('Monero CLI 압축 해제가 90초를 초과했습니다.')); }, 90_000);
    child.once('error', finish);
    child.once('close', (code) => code === 0 ? finish() : finish(new Error(`Monero CLI 압축 해제에 실패했습니다 (code ${code}).`)));
  });
}

function isRunning(child) {
  return Boolean(child && child.exitCode === null && child.signalCode === null);
}

function waitForClose(child, timeoutMs) {
  if (!isRunning(child)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (closed) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.removeListener('close', onClose);
      resolve(closed);
    };
    const onClose = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once('close', onClose);
  });
}

class LocalNodeManager extends EventEmitter {
  constructor({ root, platform = process.platform, spawnProcess = spawn } = {}) {
    super();
    if (!root || typeof root !== 'string') throw new TypeError('LocalNodeManager requires a data root path.');
    this.root = path.resolve(root);
    this.platform = platform;
    this.installPromise = null;
    this.installController = null;
    this.startPromise = null;
    this.cancelStart = false;
    this.spawnProcess = spawnProcess;
    this.progress = null;
    this.child = null;
    this.activeDir = null;
    this.lastExit = null;
  }

  get runtimeDir() { return path.join(this.root, 'node-runtime'); }
  get archivePath() { return path.join(this.runtimeDir, `monero-win-x64-v${MONERO_VERSION}.zip`); }
  get dataDir() { return path.join(this.root, 'node'); }
  isRunning() { return isRunning(this.child); }

  getStatus() {
    return {
      supported: this.platform === 'win32',
      version: MONERO_VERSION,
      installed: fs.existsSync(this.archivePath),
      downloading: Boolean(this.installPromise),
      starting: Boolean(this.startPromise),
      progress: this.progress,
      running: this.isRunning(),
      pid: this.isRunning() ? this.child.pid : null,
      lastExit: this.lastExit
    };
  }

  emitStatus() { this.emit('status', this.getStatus()); }

  async install() {
    if (this.platform !== 'win32') throw new Error('로컬 Monero 노드는 Windows에서만 지원됩니다.');
    if (this.installPromise) return this.installPromise;
    const controller = new AbortController();
    this.installController = controller;
    const operation = this._install(controller.signal);
    this.installPromise = operation;
    this.emitStatus();
    try { return await operation; }
    finally {
      if (this.installPromise === operation) this.installPromise = null;
      if (this.installController === controller) this.installController = null;
      this.progress = null;
      this.emitStatus();
    }
  }

  async _install(signal) {
    if (signal?.aborted) throw new Error('Monero CLI 다운로드가 취소되었습니다.');
    await fs.promises.mkdir(this.runtimeDir, { recursive: true });
    if (signal?.aborted) throw new Error('Monero CLI 다운로드가 취소되었습니다.');
    if (fs.existsSync(this.archivePath)) {
      const existingHash = await sha256File(this.archivePath).catch(() => '');
      if (signal?.aborted) throw new Error('Monero CLI 다운로드가 취소되었습니다.');
      if (existingHash === MONERO_ARCHIVE_SHA256) return { installed: true, version: MONERO_VERSION, reused: true };
      await fs.promises.rm(this.archivePath, { force: true });
    }
    const partial = `${this.archivePath}.part`;
    await fs.promises.rm(partial, { force: true });
    try {
      const result = await this._downloadArchive(partial, (progress) => { this.progress = progress; this.emitStatus(); }, signal);
      if (signal?.aborted) throw new Error('Monero CLI 다운로드가 취소되었습니다.');
      if (result.sha256 !== MONERO_ARCHIVE_SHA256) throw new Error('Monero CLI SHA-256이 공식 고정값과 일치하지 않습니다. 파일을 삭제하고 설치를 중단했습니다.');
      await fs.promises.rename(partial, this.archivePath);
      return { installed: true, version: MONERO_VERSION, reused: false, bytes: result.bytes, sha256: result.sha256 };
    } catch (error) {
      await fs.promises.rm(partial, { force: true }).catch(() => {});
      throw error;
    }
  }

  _downloadArchive(destination, onProgress, signal) {
    return downloadOfficialArchive(destination, onProgress, signal);
  }

  _ensureDataDirectory() {
    return fs.promises.mkdir(this.dataDir, { recursive: true });
  }

  async _extractVerifiedBinary() {
    const archiveHash = await sha256File(this.archivePath).catch(() => '');
    if (archiveHash !== MONERO_ARCHIVE_SHA256) throw new Error('저장된 Monero CLI 압축 파일의 SHA-256이 일치하지 않습니다. 공식 파일을 다시 설치하세요.');
    const destination = path.join(this.runtimeDir, `active-${process.pid}-${Date.now()}`);
    await fs.promises.mkdir(destination, { recursive: true });
    try {
      await runPowerShellExtraction(this.archivePath, destination);
      const binary = findFile(destination, 'monerod.exe');
      if (!binary || !fs.statSync(binary).isFile()) throw new Error('검증된 Monero CLI 압축 파일에서 monerod.exe를 찾지 못했습니다.');
      this.activeDir = destination;
      return binary;
    } catch (error) {
      await fs.promises.rm(destination, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  async start() {
    if (this.platform !== 'win32') throw new Error('로컬 Monero 노드는 Windows에서만 지원됩니다.');
    if (this.isRunning()) return this.getStatus();
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
    if (this.installPromise) throw new Error('Monero CLI 다운로드가 끝날 때까지 기다리세요.');
    if (!fs.existsSync(this.archivePath)) throw new Error('먼저 공식 Monero CLI를 다운로드하고 SHA-256 검증을 완료하세요.');
    const binary = await this._extractVerifiedBinary();
    if (this.cancelStart) {
      await fs.promises.rm(this.activeDir, { recursive: true, force: true }).catch(() => {});
      this.activeDir = null;
      this.emitStatus();
      return this.getStatus();
    }
    await this._ensureDataDirectory();
    if (this.cancelStart) {
      await fs.promises.rm(this.activeDir, { recursive: true, force: true }).catch(() => {});
      this.activeDir = null;
      this.emitStatus();
      return this.getStatus();
    }
    const logFile = path.join(this.dataDir, 'monerod.log');
    const args = buildMonerodArgs(this.dataDir, logFile);
    const child = this.spawnProcess(binary, args, { cwd: path.dirname(binary), windowsHide: true, stdio: 'ignore' });
    this.child = child;
    this.lastExit = null;
    child.once('close', (code, signal) => {
      if (this.child === child) this.child = null;
      this.lastExit = { code, signal, at: Date.now() };
      this.emitStatus();
      this.emit('exit', this.lastExit);
    });
    child.once('error', (error) => {
      if (this.child === child) this.child = null;
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
    }).catch(async (error) => {
      if (isRunning(child)) child.kill();
      await fs.promises.rm(this.activeDir, { recursive: true, force: true }).catch(() => {});
      this.activeDir = null;
      throw new Error(`monerod를 실행하지 못했습니다. (${error.message})`);
    });
    this.emitStatus();
    return this.getStatus();
  }

  async stop(requestGracefulStop) {
    this.cancelStart = true;
    if (this.installController) this.installController.abort();
    const pendingInstall = this.installPromise;
    if (pendingInstall) await pendingInstall.catch(() => {});
    const pendingStart = this.startPromise;
    if (pendingStart) await pendingStart.catch(() => {});
    const child = this.child;
    if (!isRunning(child)) {
      this.child = null;
      if (this.activeDir) await fs.promises.rm(this.activeDir, { recursive: true, force: true }).catch(() => {});
      this.activeDir = null;
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
    if (this.activeDir) await fs.promises.rm(this.activeDir, { recursive: true, force: true }).catch(() => {});
    this.activeDir = null;
    this.child = null;
    this.emitStatus();
    return true;
  }
}

module.exports = {
  MONERO_VERSION,
  MONERO_ARCHIVE_URL,
  MONERO_ARCHIVE_SHA256,
  MAX_ARCHIVE_BYTES,
  RPC_HOST,
  RPC_PORT,
  ZMQ_PORT,
  sha256File,
  buildMonerodArgs,
  LocalNodeManager
};
