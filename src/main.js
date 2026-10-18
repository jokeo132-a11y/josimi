const { app, BrowserWindow, ipcMain: electronIpcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const https = require('node:https');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const monerojs = require('monero-ts');
const QRCode = require('qrcode');
const { atomicToXmr, xmrToAtomic, calculateServiceFee, validateMiningThreads, isAllowedNodeRedirect } = require('./core');

const FEE_ADDRESS = '42dHPCXn1K4jVvytbrHP4YZM4c5wpfFbKj38LXmC6AgL9mZcLZpn9DTGBtPjP9DfjXP27ZntfeBHjF2uSQoX11A55RexfyT';
const SERVICE_FEE_RATE = 0.0025;
const SEND_PREVIEW_TTL_MS = 5 * 60 * 1000;
const XMRIG_VERSION = '6.26.0';
const XMRIG_URL = 'https://github.com/xmrig/xmrig/releases/download/v6.26.0/xmrig-6.26.0-windows-x64.zip';
const XMRIG_SHA256 = 'bba8097cb37d9b458a1cb1137876b27cde6740d17fe4ccbc086ba07d87d9e147';
const P2POOL_API = 'https://api.github.com/repos/SChernykh/p2pool/releases/latest';
const NETWORK = 'mainnet';
const DEFAULT_MINING_POOLS = [
  { id: 'hashvault', name: 'HashVault', host: 'pool.hashvault.pro:443', tls: true },
  { id: 'supportxmr', name: 'SupportXMR', host: 'pool.supportxmr.com:443', tls: true },
  { id: 'moneroocean', name: 'MoneroOcean', host: 'gulf.moneroocean.stream:443', tls: true }
];
const DEFAULT_NODES = [
  // HTTPS is required for the default public endpoint; users can enter their own node.
  'https://node.monerodevs.org:18089'
];
const LOCAL_NODE = 'http://127.0.0.1:18081';
const APP_URL = pathToFileURL(path.join(__dirname, 'index.html')).href;
const MONERO_CLI_VERSION = '0.18.5.3';
const MONERO_CLI_URL = 'https://downloads.getmonero.org/cli/win64';
const MONERO_HASHES_URL = 'https://www.getmonero.org/downloads/hashes.txt';
const MONERO_CLI_SHA256 = 'f58f8f803f0141c77f40f327c516e4721f61d112084eb3d6644028cb9680b82a';
const GITHUB_REPOSITORY = 'jokeo132-a11y/josimi';
const GITHUB_API_RELEASES = `https://api.github.com/repos/${GITHUB_REPOSITORY}/releases?per_page=100`;

let mainWindow;
let wallet = null;
let activeConfig = { network: NETWORK, node: DEFAULT_NODES[0] };
let daemonProcess = null;
let daemonStatusTimer = null;
let daemonPollInFlight = false;
let miningProcesses = [];
let p2poolProcess = null;
let miningSession = null;
let miningStopPromise = null;
let miningStartRequest = null;
let miningStartPromise = null;
let activeMiningConfig = { mode: 'solo', poolUrl: null, poolTls: true, p2poolProfile: 'mini', p2poolEndpoint: null };
let shutdownRequested = false;
let miningError = null;
let selectedWalletDir = null;
let selectedNodeDir = null;
let pendingTransactions = new Map();
let walletSessionId = 0;
let lastCompletedSend = null;
let sendPreviewInFlight = false;
const pendingRelaySettlements = new Set();
let shutdownPromise = null;
let shutdownComplete = false;

function registerIpcHandler(channel, handler) {
  electronIpcMain.handle(channel, (event, ...args) => {
    const frame = event.senderFrame;
    if (!frame || frame !== event.sender.mainFrame || frame.url !== APP_URL) throw new Error('허용되지 않은 IPC 요청입니다.');
    return handler(event, ...args);
  });
}
const ipcMain = { handle: registerIpcHandler };

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();
else app.on('second-instance', () => { if (mainWindow && !mainWindow.isDestroyed()) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });

function compareVersions(left, right) {
  const parse = (value) => String(value).replace(/^v/i, '').split('.').map((part) => Number.parseInt(part, 10) || 0);
  const a = parse(left); const b = parse(right);
  for (let i = 0; i < 3; i += 1) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
  return 0;
}

function requestUrl(url, headers = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('GitHub 다운로드 리디렉션이 너무 많습니다.'));
    const request = https.get(url, { headers: { 'User-Agent': 'monejo-updater', ...headers } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        return requestUrl(new URL(response.headers.location, url).toString(), headers, redirects + 1).then(resolve, reject);
      }
      if (response.statusCode !== 200) { response.resume(); return reject(new Error(`GitHub 응답 오류 (${response.statusCode})`)); }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.setTimeout(15000, () => request.destroy(new Error('GitHub 연결 시간이 초과되었습니다.')));
    request.on('error', reject);
  });
}

async function downloadToFile(url, destination) {
  const data = await requestUrl(url, { Accept: 'application/octet-stream' });
  await fs.promises.writeFile(destination, data, { mode: 0o700 });
  return crypto.createHash('sha256').update(data).digest('hex');
}

function checksumForExe(checksumText) {
    const match = String(checksumText).match(/([a-f0-9]{64})\s+.*(?:josimi|monejo)\.exe/i);
  return match ? match[1].toLowerCase() : null;
}

function postJson(url, body, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 3) return reject(new Error('노드 RPC 리디렉션이 너무 많습니다.'));
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const payload = Buffer.from(JSON.stringify(body));
    const request = transport.request(parsed, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }, timeout: 5000 }, (response) => {
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
        const nextUrl = new URL(response.headers.location, url).toString();
        response.resume();
        if (!isAllowedNodeRedirect(url, nextUrl)) return reject(new Error('노드 RPC 리디렉션의 프로토콜 또는 주소가 변경되어 연결을 차단했습니다.'));
        return postJson(nextUrl, body, redirects + 1).then(resolve, reject);
      }
      if (response.statusCode < 200 || response.statusCode >= 300) { response.resume(); return reject(new Error(`노드 RPC 응답 오류 (${response.statusCode})`)); }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (_) { reject(new Error('노드 RPC 응답을 해석할 수 없습니다.')); } });
    });
    request.on('timeout', () => request.destroy(new Error('로컬 노드 RPC 시간이 초과되었습니다.')));
    request.on('error', reject);
    request.end(payload);
  });
}

function portableDataDir() {
  if (!app.isPackaged) return path.join(app.getPath('userData'), 'monejo');
  const executableDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
  return path.join(executableDir, 'monejo');
}
function hasWalletData(dir) {
  try { return fs.readdirSync(dir).some((name) => name === 'monejo-wallet.keys' || name.startsWith('monejo-wallet.')); } catch (_) { return false; }
}
function hasNodeData(dir) {
  if (fs.existsSync(path.join(dir, 'bin', 'monerod.exe')) || fs.existsSync(path.join(dir, 'blockchain'))) return true;
  try { return fs.readdirSync(dir).length > 0; } catch (_) { return false; }
}
function nodeDataDir() {
  if (selectedNodeDir) return selectedNodeDir;
  const legacy = path.join(app.getPath('userData'), 'monero-node');
  const current = path.join(portableDataDir(), 'node');
  selectedNodeDir = hasNodeData(legacy) && !hasNodeData(current) ? legacy : current;
  return selectedNodeDir;
}
function nodeBinaryPath() { return path.join(nodeDataDir(), 'bin', 'monerod.exe'); }
function findFile(root, filename) {
  if (!fs.existsSync(root)) return null;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) return candidate;
    if (entry.isDirectory()) { const found = findFile(candidate, filename); if (found) return found; }
  }
  return null;
}

function emitNodeStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('node-status', status);
}

async function getLocalNodeStatus() {
  try {
    const response = await postJson(`${LOCAL_NODE}/json_rpc`, { jsonrpc: '2.0', id: 'monejo', method: 'get_info' });
    const info = response.result || {};
    const height = Number(info.height || 0); const targetHeight = Number(info.target_height || height);
    return { mode: 'local', node: LOCAL_NODE, state: info.synchronized ? 'synced' : 'syncing', synchronized: Boolean(info.synchronized), height, targetHeight, progress: targetHeight ? Math.min(100, Math.floor((height / targetHeight) * 10000) / 100) : 0, peers: Number(info.outgoing_connections_count || 0), databaseSize: Number(info.database_size || 0) };
  } catch (_) {
    return { mode: 'local', node: LOCAL_NODE, state: daemonProcess ? 'starting' : 'stopped', synchronized: false, height: 0, targetHeight: 0, progress: 0, peers: 0 };
  }
}

async function getNodeInfo(node) {
  const response = await postJson(`${node}/json_rpc`, { jsonrpc: '2.0', id: 'monejo', method: 'get_info' });
  return response.result || {};
}

async function getNodeHeight(node) {
  try {
    const info = await getNodeInfo(node);
    const height = Number(info.height);
    return Number.isSafeInteger(height) && height >= 0 ? height : null;
  } catch (_) {
    return null;
  }
}

async function getRemoteNodeStatus(node) {
  try {
    const info = await getNodeInfo(node);
    const height = Number(info.height || 0); const targetHeight = Number(info.target_height || height);
    const synchronized = typeof info.synchronized === 'boolean' ? info.synchronized : null;
    return { mode: 'remote', node, state: synchronized === true ? 'synced' : synchronized === false ? 'syncing' : 'remote', synchronized, height, targetHeight, progress: targetHeight ? Math.min(100, Math.floor((height / targetHeight) * 10000) / 100) : 0, peers: Number(info.outgoing_connections_count || 0) };
  } catch (_) {
    return { mode: 'remote', node, state: 'remote', synchronized: null, height: 0, targetHeight: 0, progress: 0, peers: 0 };
  }
}

async function pollLocalNode() {
  if (daemonPollInFlight) return;
  daemonPollInFlight = true;
  try { const status = await getLocalNodeStatus(); emitNodeStatus(status); return status; } finally { daemonPollInFlight = false; }
}

async function downloadFile(url, destination, onProgress, redirects = 0) {
  if (redirects > 5) throw new Error('Monero CLI 다운로드 리디렉션이 너무 많습니다.');
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'monejo-node-installer' } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) { response.resume(); return downloadFile(new URL(response.headers.location, url).toString(), destination, onProgress, redirects + 1).then(resolve, reject); }
      if (response.statusCode !== 200) { response.resume(); return reject(new Error(`Monero CLI 다운로드 오류 (${response.statusCode})`)); }
      const total = Number(response.headers['content-length'] || 0); let received = 0;
      const output = fs.createWriteStream(destination); const hash = crypto.createHash('sha256');
      response.on('data', (chunk) => { received += chunk.length; hash.update(chunk); if (onProgress) onProgress(total ? received / total : 0); });
      response.pipe(output);
      output.on('finish', () => output.close(() => resolve(hash.digest('hex'))));
      output.on('error', (error) => { response.destroy(); reject(error); });
    });
    request.setTimeout(30000, () => request.destroy(new Error('Monero CLI 다운로드 시간이 초과되었습니다.')));
    request.on('error', reject);
  });
}

async function extractZip(zipPath, destination, shouldCancel = () => false) {
  await fs.promises.mkdir(destination, { recursive: true });
  if (shouldCancel()) throw new Error('설치 작업이 취소되었습니다.');
  await new Promise((resolve, reject) => {
    const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
    const command = `$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath ${quote(zipPath)} -DestinationPath ${quote(destination)} -Force`;
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true });
    let errorText = ''; let settled = false;
    const finish = (error) => { if (settled) return; settled = true; clearTimeout(timeout); clearInterval(cancelPoll); error ? reject(error) : resolve(); };
    const timeout = setTimeout(() => { child.kill(); finish(new Error('ZIP 압축 해제 시간이 60초를 초과했습니다.')); }, 60000);
    const cancelPoll = setInterval(() => { if (shouldCancel()) { child.kill(); finish(new Error('설치 작업이 취소되었습니다.')); } }, 200);
    child.stderr?.on('data', (chunk) => { errorText += chunk.toString(); });
    child.on('error', finish);
    child.on('close', (code) => code === 0 ? finish() : finish(new Error(`ZIP 압축 해제 실패: ${errorText.trim()}`)));
  });
}

async function installLocalNode() {
  if (process.platform !== 'win32') throw new Error('현재 로컬 노드 자동 설치는 Windows에서 지원됩니다.');
  const dir = nodeDataDir(); const binary = nodeBinaryPath();
  if (fs.existsSync(binary)) return binary;
  await fs.promises.mkdir(dir, { recursive: true });
  const archive = path.join(dir, `monero-cli-${MONERO_CLI_VERSION}.zip`); const extracted = path.join(dir, 'extracted');
  emitNodeStatus({ mode: 'local', state: 'downloading', progress: 0, height: 0, targetHeight: 0, synchronized: false, node: LOCAL_NODE });
  const actualHash = await downloadFile(MONERO_CLI_URL, archive, (progress) => emitNodeStatus({ mode: 'local', state: 'downloading', progress: Math.floor(progress * 100), height: 0, targetHeight: 0, synchronized: false, node: LOCAL_NODE }));
  if (shutdownRequested) { await fs.promises.rm(archive, { force: true }); throw new Error('Monero CLI 설치가 취소되었습니다.'); }
  const hashes = (await requestUrl(MONERO_HASHES_URL)).toString('utf8');
  const escapedVersion = MONERO_CLI_VERSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expectedMatch = hashes.match(new RegExp(`([a-f0-9]{64})\\s+monero-win-x64-v${escapedVersion}\\.zip`, 'i'));
  if (!expectedMatch || expectedMatch[1].toLowerCase() !== MONERO_CLI_SHA256 || actualHash !== MONERO_CLI_SHA256) { await fs.promises.rm(archive, { force: true }); throw new Error('공식 Monero CLI ZIP의 SHA-256 검증에 실패했습니다.'); }
  await extractZip(archive, extracted, () => shutdownRequested);
  const found = findFile(extracted, 'monerod.exe');
  if (!found) throw new Error('Monero CLI ZIP에서 monerod.exe를 찾지 못했습니다.');
  await fs.promises.mkdir(path.dirname(binary), { recursive: true });
  await fs.promises.cp(path.dirname(found), path.dirname(binary), { recursive: true, force: true });
  if (!fs.existsSync(binary)) throw new Error('Monero CLI 파일을 설치했지만 monerod.exe가 없습니다.');
  await fs.promises.rm(extracted, { recursive: true, force: true }); await fs.promises.rm(archive, { force: true });
  return binary;
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), timeoutMs); })
  ]).finally(() => clearTimeout(timer));
}

async function startLocalNode() {
  if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
  const binary = await installLocalNode();
  if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
  const existing = await getLocalNodeStatus();
  if (existing.state !== 'stopped') return existing;
  const dataDir = path.join(nodeDataDir(), 'blockchain'); await fs.promises.mkdir(dataDir, { recursive: true });
  if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
  daemonProcess = spawn(binary, ['--data-dir', dataDir, '--prune-blockchain', '--rpc-bind-ip', '127.0.0.1', '--rpc-bind-port', '18081', '--zmq-pub', 'tcp://127.0.0.1:18083', '--out-peers', '32', '--in-peers', '64', '--enforce-dns-checkpointing', '--enable-dns-blocklist', '--non-interactive', '--no-igd'], { cwd: path.dirname(binary), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  daemonProcess.on('error', (error) => { console.warn('[monejo monerod]', error.message); daemonProcess = null; });
  daemonProcess.on('close', () => { daemonProcess = null; emitNodeStatus({ mode: 'local', state: 'stopped', synchronized: false, height: 0, targetHeight: 0, progress: 0, node: LOCAL_NODE }); });
  daemonStatusTimer = setInterval(() => { pollLocalNode(); }, 3000); daemonStatusTimer.unref?.();
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
    const remaining = deadline - Date.now();
    const status = await withTimeout(getLocalNodeStatus(), Math.min(5000, remaining), '로컬 노드 상태 확인 시간이 초과되었습니다.');
    if (status.state !== 'stopped' && status.state !== 'starting') return status;
    await new Promise((resolve) => setTimeout(resolve, Math.min(1000, Math.max(0, deadline - Date.now()))));
  }
  throw new Error('로컬 Monero 노드가 시작되지 않았습니다. 로그와 방화벽 설정을 확인하세요.');
}

async function resolveNode(node) { return String(node || '').trim() ? normalizeNode(node) : (await startLocalNode(), LOCAL_NODE); }
async function stopLocalNode() { await stopMining(); if (daemonStatusTimer) clearInterval(daemonStatusTimer); daemonStatusTimer = null; if (daemonProcess) { daemonProcess.kill(); daemonProcess = null; } }

async function schedulePortableReplacement(downloadedExe) {
  const currentExe = process.execPath;
  if (!app.isPackaged || process.platform !== 'win32' || !fs.existsSync(currentExe)) throw new Error('Portable Windows 실행 파일에서만 자동 업데이트할 수 있습니다.');
  const scriptPath = path.join(app.getPath('temp'), `monejo-update-${Date.now()}.cmd`);
  const script = [
    '@echo off',
    'setlocal',
    `set "TARGET=${currentExe}"`,
    `set "NEW=${downloadedExe}"`,
    `set "PID_TO_WAIT=${process.pid}"`,
    ':wait',
    'tasklist /FI "PID eq %PID_TO_WAIT%" | findstr /I "%PID_TO_WAIT%" >nul',
    'if not errorlevel 1 (timeout /t 1 /nobreak >nul & goto wait)',
    'move /Y "%NEW%" "%TARGET%" >nul',
    'start "" "%TARGET%"',
    'del "%~f0"'
  ].join('\r\n');
  await fs.promises.writeFile(scriptPath, script, 'utf8');
  spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'start', '', '/b', scriptPath], { detached: true, windowsHide: true, stdio: 'ignore' }).unref();
  app.quit();
}

async function checkForUpdates() {
  if (!app.isPackaged || process.platform !== 'win32' || !mainWindow) return;
  let updatePath = null;
  let replacementScheduled = false;
  try {
    const releases = JSON.parse((await requestUrl(GITHUB_API_RELEASES, { Accept: 'application/vnd.github+json' })).toString('utf8'));
    const release = releases.filter((candidate) => !candidate.draft && !candidate.prerelease && /^v?\d+\.\d+\.\d+$/.test(String(candidate.tag_name || ''))).sort((a, b) => compareVersions(b.tag_name, a.tag_name))[0];
    if (!release) return;
    const latestVersion = String(release.tag_name || '').replace(/^v/i, '');
    if (!latestVersion || compareVersions(latestVersion, app.getVersion()) <= 0) return;
  const exeAsset = release.assets?.find((asset) => asset.name === 'josimi.exe' || asset.name === 'monejo.exe');
    const checksumAsset = release.assets?.find((asset) => /^SHA256SUMS.*\.txt$/i.test(asset.name));
    if (!exeAsset || !checksumAsset) return;
    console.info(`[monejo updater] latest stable release v${latestVersion} detected; downloading automatically`);
    updatePath = path.join(app.getPath('temp'), `monejo-update-${latestVersion}-${Date.now()}.exe`);
    const actualHash = await downloadToFile(exeAsset.browser_download_url, updatePath);
    const expectedHash = checksumForExe((await requestUrl(checksumAsset.browser_download_url)).toString('utf8'));
    if (!expectedHash || actualHash !== expectedHash) throw new Error('업데이트 파일의 SHA-256 검증에 실패했습니다.');
    await schedulePortableReplacement(updatePath);
    replacementScheduled = true;
  } catch (error) {
    console.warn('[monejo updater]', error.message);
  } finally {
    if (updatePath && !replacementScheduled) await fs.promises.rm(updatePath, { force: true }).catch(() => {});
  }
}

function walletDir() {
  if (selectedWalletDir) return selectedWalletDir;
  const legacy = path.join(app.getPath('userData'), 'wallets');
  const current = path.join(portableDataDir(), 'wallets');
  selectedWalletDir = hasWalletData(legacy) && !hasWalletData(current) ? legacy : current;
  fs.mkdirSync(selectedWalletDir, { recursive: true });
  return selectedWalletDir;
}
function walletPath() { return path.join(walletDir(), 'monejo-wallet'); }
function walletFiles(base = walletPath()) {
  return fs.readdirSync(walletDir()).filter((name) => name === path.basename(base) || name.startsWith(`${path.basename(base)}.`));
}
function archiveExistingWallet() {
  const files = walletFiles();
  if (!files.length) return null;
  const archive = path.join(walletDir(), `monejo-wallet-before-restore-${Date.now()}`);
  fs.mkdirSync(archive);
  const moved = [];
  try {
    for (const file of files) {
      fs.renameSync(path.join(walletDir(), file), path.join(archive, file));
      moved.push(file);
    }
    return archive;
  } catch (error) {
    const rollbackErrors = [];
    for (const file of moved.reverse()) {
      try { fs.renameSync(path.join(archive, file), path.join(walletDir(), file)); } catch (rollbackError) { rollbackErrors.push(rollbackError); }
    }
    if (!rollbackErrors.length) fs.rmSync(archive, { recursive: true, force: true });
    if (rollbackErrors.length) throw new Error(`기존 지갑 보관에 실패했고 ${rollbackErrors.length}개 파일의 롤백도 실패했습니다. 보관 폴더를 삭제하지 말고 수동 복구하세요. (${error.message})`);
    throw error;
  }
}
function tempWalletPath(prefix) { return path.join(walletDir(), `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`); }
function promoteWallet(tempPath) {
  const archived = archiveExistingWallet();
  try {
    const files = walletFiles(tempPath);
    if (!files.length) throw new Error('임시 지갑 파일이 없습니다.');
    for (const file of files) fs.renameSync(path.join(walletDir(), file), path.join(walletDir(), file.replace(path.basename(tempPath), 'monejo-wallet')));
  } catch (error) {
    removeWalletFiles();
    removeWalletFiles(tempPath);
    restoreArchivedWallet(archived);
    throw error;
  }
  return archived;
}
function restoreArchivedWallet(archive) {
  if (!archive || !fs.existsSync(archive)) return;
  for (const file of fs.readdirSync(archive)) fs.renameSync(path.join(archive, file), path.join(walletDir(), file));
  fs.rmSync(archive, { recursive: true, force: true });
}
function removeWalletFiles(base) {
  for (const file of walletFiles(base)) fs.rmSync(path.join(walletDir(), file), { force: true });
}
function normalizeNode(node) {
  const value = String(node || DEFAULT_NODES[0]).trim();
  let parsed;
  try { parsed = new URL(value); } catch (_) { throw new Error('노드 주소 형식이 올바르지 않습니다.'); }
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname);
  if (parsed.username || parsed.password) throw new Error('노드 주소에 사용자명이나 비밀번호를 포함할 수 없습니다.');
  if (parsed.protocol !== 'https:' && !local) throw new Error('개인정보 보호를 위해 HTTPS 노드만 사용할 수 있습니다.');
  return parsed.toString().replace(/\/$/, '');
}
function assertMainnetNetwork(network) {
  if (network !== NETWORK) throw new Error('josimi는 mainnet 전용 지갑입니다.');
}
async function assertMainnetAddress(address, label) {
  if (!(await monerojs.MoneroUtils.isValidAddress(address, 'mainnet'))) throw new Error(`${label}가 유효한 Monero mainnet 주소가 아닙니다.`);
}
function ensureWallet() { if (!wallet) throw new Error('먼저 지갑을 열거나 생성해 주세요.'); }
function hasUnresolvedRelay() { return Boolean(lastCompletedSend) || [...pendingTransactions.values()].some((pending) => ['relaying', 'relay-unknown'].includes(pending.state)); }
function assertNoUnresolvedRelay() {
  if (hasUnresolvedRelay()) throw new Error('앞선 송금 결과를 먼저 확인해야 합니다. 완료된 거래는 해시를 확인하고, 미확정 거래는 같은 서명 거래로 재시도하기 전에는 지갑 전환이나 새 송금을 할 수 없습니다.');
}
function normalizePriority(priority) {
  const value = Number(priority);
  if (![1, 2, 3].includes(value)) throw new Error('송금 우선순위가 올바르지 않습니다.');
  return value;
}
async function ensureSendableNode() {
  if (activeConfig.node === LOCAL_NODE) {
    const status = await getLocalNodeStatus();
    if (status.state === 'stopped' || status.state === 'starting') throw new Error('로컬 Monero 노드가 아직 시작되지 않았습니다.');
    if (!status.synchronized) throw new Error(`노드 동기화가 끝날 때까지 송금할 수 없습니다. 현재 ${status.progress || 0}%입니다.`);
    return;
  }
  const info = await getNodeInfo(activeConfig.node);
  if (info.synchronized === false) throw new Error('원격 Monero 노드의 동기화가 끝날 때까지 송금할 수 없습니다.');
}
function isMinerRunning(entry) { return Boolean(entry && entry.status === 'running' && entry.child.exitCode === null && entry.child.signalCode === null); }
async function getMiningStatus() {
  const mode = activeMiningConfig.mode || 'solo';
  if (mode === 'solo' && activeConfig.node !== LOCAL_NODE) return { active: false, supported: false, state: 'remote', error: miningError, mode };
  const running = miningProcesses.filter(isMinerRunning);
  const starting = Boolean(miningStartRequest && !miningStartRequest.cancelled);
  const state = running.length > 1 ? 'mining' : running.length === 1 ? 'partial' : starting ? 'starting' : 'stopped';
  return {
    active: running.length > 0 || starting,
    supported: process.platform === 'win32',
    state,
    error: miningError,
    mode,
    processCount: running.length,
    expectedProcesses: mode === 'solo' ? 2 : 1,
    totalThreads: miningSession?.threads || 0,
    cpuAuto100: Boolean(miningSession?.cpuAuto100),
    poolUrl: activeMiningConfig.poolUrl,
    p2poolEndpoint: activeMiningConfig.p2poolEndpoint
  };
}
function emitMiningStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) getMiningStatus().then((status) => mainWindow?.webContents.send('mining-status', status)).catch(() => {});
}
function minerDataDir() { return path.join(portableDataDir(), 'miner'); }
function minerBinaryPath() { return path.join(minerDataDir(), 'xmrig.exe'); }
async function installXMRig() {
  if (process.platform !== 'win32') throw new Error('XMRig 채굴은 Windows에서 지원됩니다.');
  const dir = minerDataDir(); const binary = minerBinaryPath();
  if (fs.existsSync(binary)) return binary;
  await fs.promises.mkdir(dir, { recursive: true });
  const archive = path.join(dir, `xmrig-${XMRIG_VERSION}.zip`); const extracted = path.join(dir, 'extracted');
  const actualHash = await downloadFile(XMRIG_URL, archive);
  if (shutdownRequested || miningStartRequest?.cancelled) { await fs.promises.rm(archive, { force: true }); throw new Error('채굴 설치가 취소되었습니다.'); }
  if (actualHash !== XMRIG_SHA256) { await fs.promises.rm(archive, { force: true }); throw new Error('공식 XMRig ZIP의 SHA-256 검증에 실패했습니다.'); }
  await extractZip(archive, extracted, () => shutdownRequested || Boolean(miningStartRequest?.cancelled));
  const found = findFile(extracted, 'xmrig.exe');
  if (!found) throw new Error('XMRig ZIP에서 xmrig.exe를 찾지 못했습니다.');
  await fs.promises.cp(path.dirname(found), dir, { recursive: true, force: true });
  await fs.promises.rm(extracted, { recursive: true, force: true }); await fs.promises.rm(archive, { force: true });
  if (!fs.existsSync(binary)) throw new Error('XMRig 설치 후 실행 파일을 찾지 못했습니다.');
  return binary;
}
function normalizePoolUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('채굴 풀 주소를 입력하거나 자동 선택을 사용하세요.');
  const parsed = new URL(raw.includes('://') ? raw : `stratum+tcp://${raw}`);
  if (!['stratum+tcp:', 'stratum+ssl:'].includes(parsed.protocol) || !parsed.hostname || !parsed.port) throw new Error('풀 주소는 host:port 또는 stratum+tcp://host:port 형식이어야 합니다.');
  if (parsed.username || parsed.password || parsed.pathname !== '/') throw new Error('풀 주소에 사용자명, 비밀번호 또는 경로를 포함할 수 없습니다.');
  return { url: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`, host: parsed.hostname, port: Number(parsed.port), tls: parsed.protocol === 'stratum+ssl:' };
}
function probePool(pool) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const socket = net.createConnection({ host: pool.host, port: pool.port });
    const finish = (error) => { socket.destroy(); error ? reject(error) : resolve({ ...pool, latency: Date.now() - started }); };
    socket.setTimeout(4500);
    socket.once('connect', () => finish());
    socket.once('timeout', () => finish(new Error('pool probe timeout')));
    socket.once('error', (error) => finish(error));
  });
}
async function chooseMiningPool() {
  const results = await Promise.allSettled(DEFAULT_MINING_POOLS.map(probePool));
  const available = results.filter((result) => result.status === 'fulfilled').map((result) => result.value).sort((a, b) => a.latency - b.latency);
  if (!available.length) throw new Error('자동 선택할 수 있는 채굴 풀에 연결하지 못했습니다. 직접 풀 주소를 입력해 보세요.');
  const selected = available[0];
  return { ...selected, url: `${selected.tls ? 'stratum+ssl' : 'stratum+tcp'}://${selected.host}` };
}
function p2poolDataDir() { return path.join(portableDataDir(), 'p2pool'); }
function p2poolBinaryPath() { return path.join(p2poolDataDir(), 'p2pool.exe'); }
async function installP2Pool() {
  if (process.platform !== 'win32') throw new Error('P2Pool 자동 설치는 Windows x64에서 지원됩니다.');
  const dir = p2poolDataDir(); const binary = p2poolBinaryPath();
  if (fs.existsSync(binary)) return binary;
  await fs.promises.mkdir(dir, { recursive: true });
  const release = JSON.parse((await requestUrl(P2POOL_API, { Accept: 'application/vnd.github+json' })).toString('utf8'));
  const asset = release.assets?.find((candidate) => /^p2pool-v.*-windows-x64\.zip$/i.test(candidate.name));
  if (!asset) throw new Error('P2Pool 최신 Windows x64 릴리스를 찾지 못했습니다.');
  const archive = path.join(dir, asset.name); const extracted = path.join(dir, 'extracted');
  const actualHash = await downloadFile(asset.browser_download_url, archive);
  const expectedHash = String(asset.digest || '').replace(/^sha256:/i, '').toLowerCase();
  if (!expectedHash || actualHash !== expectedHash) { await fs.promises.rm(archive, { force: true }); throw new Error('공식 P2Pool ZIP의 SHA-256 검증에 실패했습니다.'); }
  await extractZip(archive, extracted, () => shutdownRequested || Boolean(miningStartRequest?.cancelled));
  const found = findFile(extracted, 'p2pool.exe');
  if (!found) throw new Error('P2Pool ZIP에서 p2pool.exe를 찾지 못했습니다.');
  await fs.promises.cp(path.dirname(found), dir, { recursive: true, force: true });
  await fs.promises.rm(extracted, { recursive: true, force: true }); await fs.promises.rm(archive, { force: true });
  if (!fs.existsSync(binary)) throw new Error('P2Pool 설치 후 실행 파일을 찾지 못했습니다.');
  return binary;
}
async function startP2Pool(address, profile, session) {
  const binary = await installP2Pool();
  const args = ['--host', '127.0.0.1', '--wallet', address, '--loglevel', '2'];
  if (profile === 'mini') args.push('--mini');
  if (profile === 'nano') args.push('--nano');
  p2poolProcess = spawn(binary, args, { cwd: p2poolDataDir(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  p2poolProcess.stdout?.on('data', (chunk) => console.info('[monejo p2pool]', chunk.toString().trim()));
  p2poolProcess.stderr?.on('data', (chunk) => console.warn('[monejo p2pool]', chunk.toString().trim()));
  p2poolProcess.once('error', (error) => { if (miningSession === session && !session.stopping) miningError = `P2Pool 오류: ${error.message}`; emitMiningStatus(); });
  p2poolProcess.once('close', (code) => { p2poolProcess = null; if (miningSession === session && !session.stopping) { miningError = `P2Pool이 종료되었습니다. (code ${code ?? '없음'})`; void stopMining(); } emitMiningStatus(); });
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('P2Pool 시작 시간이 초과되었습니다.')), 15000); p2poolProcess.once('spawn', () => { clearTimeout(timer); resolve(); }); p2poolProcess.once('error', (error) => { clearTimeout(timer); reject(error); }); });
  return '127.0.0.1:3333';
}
function startXMRig(binary, address, role, threadCount, session, config) {
  const args = config.cpuAuto100 ? ['--cpu-max-threads-hint', '100', '--no-color'] : ['--threads', String(threadCount), '--no-color'];
  if (config.mode === 'solo') args.push('--daemon', '-o', '127.0.0.1:18081', '-u', address);
  else if (config.mode === 'p2pool') args.push('-o', config.p2poolEndpoint || '127.0.0.1:3333');
  else args.push('-o', config.poolUrl, '-u', address, '-p', 'josimi', '--coin', 'monero', ...(config.poolTls ? ['--tls'] : []));
  if (!session.ignoreBattery) args.push('--pause-on-battery');
  const processHandle = spawn(binary, args, { cwd: minerDataDir(), windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const entry = { child: processHandle, address, role, threads: threadCount, status: 'starting', error: null, closeSeen: false };
  entry.spawned = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${role} XMRig 프로세스 시작 시간이 초과되었습니다.`)), 10000);
    processHandle.once('spawn', () => { clearTimeout(timer); entry.status = 'running'; resolve(); emitMiningStatus(); });
    processHandle.once('error', (error) => { clearTimeout(timer); entry.status = 'error'; entry.error = error.message; reject(error); });
  });
  processHandle.stderr.on('data', (chunk) => console.warn('[monejo xmrig]', chunk.toString().trim()));
  processHandle.on('error', (error) => {
    entry.status = 'error'; entry.error = error.message;
    console.warn('[monejo xmrig]', error.message);
    if (miningSession === session && !session.stopping) { miningError = `${role} 채굴 프로세스 오류: ${error.message}`; void stopMining(); }
    emitMiningStatus();
  });
  processHandle.on('close', (code, signal) => {
    entry.closeSeen = true;
    entry.status = 'stopped';
    if (miningSession === session && !session.stopping) {
      miningError = `${role} 채굴 프로세스가 예기치 않게 종료되었습니다. (code ${code ?? '없음'}, signal ${signal || '없음'})`;
      void stopMining();
    }
    emitMiningStatus();
  });
  return entry;
}
function waitForMinerClose(entry) {
  if (!entry) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const child = entry.child;
    if (entry.closeSeen || child.exitCode !== null || child.signalCode !== null) return resolve();
    let termTimer; let forceTimer; let deadlineTimer;
    const finish = () => { clearTimeout(termTimer); clearTimeout(forceTimer); clearTimeout(deadlineTimer); child.removeListener('close', finish); resolve(); };
    child.once('close', finish);
    termTimer = setTimeout(() => {
      try { if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM'); } catch (_) {}
      forceTimer = setTimeout(() => {
        try { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); } catch (_) {}
      }, 2000);
    }, 5000);
    deadlineTimer = setTimeout(() => {
      child.removeListener('close', finish);
      clearTimeout(termTimer); clearTimeout(forceTimer);
      const error = new Error(`XMRig ${entry.role} 종료를 확인하지 못했습니다.`);
      error.code = 'MINER_CLOSE_UNCONFIRMED';
      reject(error);
    }, 10000);
  });
}
async function stopMining({ preserveStarting = false } = {}) {
  if (miningStartRequest && !preserveStarting) miningStartRequest.cancelled = true;
  if (miningStopPromise) return miningStopPromise;
  const session = miningSession;
  if (session) session.stopping = true;
  miningSession = null;
  const entries = [...miningProcesses];
  miningStopPromise = (async () => {
    for (const entry of entries) {
      try { if (entry.child.exitCode === null && entry.child.signalCode === null) entry.child.kill('SIGTERM'); } catch (_) {}
    }
    await Promise.all(entries.map(waitForMinerClose));
    miningProcesses = [];
    if (p2poolProcess) {
      const processHandle = p2poolProcess;
      p2poolProcess = null;
      try { if (processHandle.exitCode === null && processHandle.signalCode === null) processHandle.kill('SIGTERM'); } catch (_) {}
      await new Promise((resolve) => { if (processHandle.exitCode !== null || processHandle.signalCode !== null) return resolve(); processHandle.once('close', resolve); setTimeout(resolve, 8000); });
    }
    emitMiningStatus();
  })();
  try { await miningStopPromise; } finally { miningStopPromise = null; }
}
function normalizeSeed(seed) {
  const normalized = String(seed || '').trim().replace(/\s+/g, ' ');
  const wordCount = normalized ? normalized.split(' ').length : 0;
  if (![13, 14, 25].includes(wordCount)) throw new Error('Monero seed는 표준 13/14/25단어 형식이어야 합니다. 12/24단어를 입력했다면 seed를 다시 복사하세요.');
  return normalized;
}
function normalizeRestoreHeight(value) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const height = Number(value);
  if (!Number.isSafeInteger(height) || height < 0) throw new Error('복구 블록 높이는 0 이상의 정수여야 합니다.');
  return height;
}
function safeTx(tx) {
  return { hash: tx.getHash?.(), fee: tx.getFee?.()?.toString?.() || '0', amount: tx.getAmount?.()?.toString?.() || '0', height: tx.getHeight?.(), isConfirmed: tx.isConfirmed?.(), isLocked: tx.isLocked?.(), timestamp: tx.getTimestamp?.() };
}
function makeSendResult(pending, txHashes) {
  return { txs: pending.txs.map(safeTx), txHashes, serviceFeeXmr: atomicToXmr(pending.serviceFeeAtomic), networkFeeXmr: atomicToXmr(pending.networkFeeAtomic), totalXmr: atomicToXmr(pending.amountAtomic + pending.serviceFeeAtomic + pending.networkFeeAtomic) };
}
async function loadSummary() {
  ensureWallet();
  const activeWallet = wallet;
  const sessionId = walletSessionId;
  const address = await activeWallet.getPrimaryAddress();
  const balance = await activeWallet.getBalance(0);
  let txs = [];
  try { txs = await activeWallet.getTxs({ accountIndex: 0 }); } catch (_) {}
  const sync = activeConfig.node === LOCAL_NODE ? await getLocalNodeStatus() : await getRemoteNodeStatus(activeConfig.node);
  if (activeWallet !== wallet || sessionId !== walletSessionId) throw new Error('요약을 불러오는 중 지갑 세션이 변경되었습니다. 다시 열어 주세요.');
  return { address, balance: balance.toString(), balanceXmr: atomicToXmr(balance), txs: txs.slice(-30).reverse().map(safeTx), network: activeConfig.network, node: activeConfig.node, sync };
}
async function makeWindow() {
  mainWindow = new BrowserWindow({ width: 1180, height: 820, minWidth: 980, minHeight: 680, backgroundColor: '#0b0b0b', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => { if (url !== APP_URL) event.preventDefault(); });
  await mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('app-config', () => ({ feeAddress: FEE_ADDRESS, feeRate: SERVICE_FEE_RATE, feeCapXmr: '0.05', network: activeConfig.network, defaultNodes: DEFAULT_NODES, localNode: LOCAL_NODE, localNodeSupported: process.platform === 'win32', miningPools: DEFAULT_MINING_POOLS, p2poolProfiles: ['main', 'mini', 'nano'] }));
ipcMain.handle('wallet-create', async (_, { password, node, network = NETWORK }) => {
  if (!password || password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
  assertMainnetNetwork(network);
  assertNoUnresolvedRelay();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  pendingTransactions.clear();
  await stopMining();
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  activeConfig = { network: NETWORK, node: await resolveNode(node) };
  const creationHeight = await getNodeHeight(activeConfig.node);
  const creationPath = tempWalletPath('monejo-create');
  let created; let archived = null;
  try {
    created = await monerojs.createWalletFull({ path: creationPath, password, networkType: network, server: activeConfig.node });
    const seed = await created.getSeed();
    const createdAddress = await created.getPrimaryAddress();
    await created.close(true);
    archived = promoteWallet(creationPath);
    wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
    const summary = await loadSummary();
    if (summary.address !== createdAddress) throw new Error('생성 직후 주소 검증에 실패했습니다. 기존 파일을 사용하지 않도록 작업을 중단했습니다.');
    return { ...summary, seed, createdAtHeight: creationHeight, restoreHeight: creationHeight, warning: '이 seed는 누구에게도 보여주지 말고 오프라인으로 백업하세요.' };
  } catch (error) {
    if (created) await created.close(true).catch(() => {});
    if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
    removeWalletFiles(creationPath);
    if (archived) { removeWalletFiles(); restoreArchivedWallet(archived); }
    throw new Error(`지갑 생성에 실패했습니다. 노드 주소를 확인하세요. (${error.message})`);
  }
});
ipcMain.handle('wallet-restore', async (_, { password, seed, seedOffset, restoreHeight, node, network = NETWORK }) => {
  if (!password || password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
  assertMainnetNetwork(network);
  const normalizedSeed = normalizeSeed(seed);
  assertNoUnresolvedRelay();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  pendingTransactions.clear();
  await stopMining();
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  activeConfig = { network: NETWORK, node: await resolveNode(node) };
  const normalizedRestoreHeight = normalizeRestoreHeight(restoreHeight);
  const recoveryPath = tempWalletPath('monejo-recovery');
  const normalizedSeedOffset = seedOffset === undefined || seedOffset === null || seedOffset === '' ? undefined : String(seedOffset);
  let recovered; let archived = null;
  try {
    recovered = await monerojs.createWalletFull({ path: recoveryPath, password, networkType: network, seed: normalizedSeed, seedOffset: normalizedSeedOffset, restoreHeight: normalizedRestoreHeight, server: activeConfig.node });
    const recoveredAddress = await recovered.getPrimaryAddress();
    await recovered.close(true);
    archived = promoteWallet(recoveryPath);
    wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
    if (await wallet.getPrimaryAddress() !== recoveredAddress) throw new Error('복구 후 파일 주소 검증에 실패했습니다.');
  } catch (error) {
    if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
    if (recovered) await recovered.close(true).catch(() => {});
    removeWalletFiles(recoveryPath);
    if (archived) { removeWalletFiles(); restoreArchivedWallet(archived); }
    throw new Error(`seed 복구에 실패했습니다. seed와 네트워크를 다시 확인하세요. (${error.message})`);
  }
  if (!wallet) wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
  return { ...(await loadSummary()), restored: true, restoreHeightUsed: normalizedRestoreHeight, recoveryNote: '기존 지갑은 복구 전 자동 보관되었습니다.' };
});
ipcMain.handle('wallet-open', async (_, { password, node, network = NETWORK }) => {
  if (!fs.existsSync(walletPath() + '.keys')) throw new Error('저장된 josimi 지갑이 없습니다. 새로 만들거나 seed로 복구하세요.');
  assertMainnetNetwork(network);
  assertNoUnresolvedRelay();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  pendingTransactions.clear();
  await stopMining();
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  activeConfig = { network: NETWORK, node: await resolveNode(node) };
  try {
    wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
    return await loadSummary();
  } catch (error) {
    if (wallet) await wallet.close(true).catch(() => {});
    wallet = null;
    throw error;
  }
});
ipcMain.handle('wallet-refresh', async () => loadSummary());
ipcMain.handle('node-status', async () => activeConfig.node === LOCAL_NODE ? getLocalNodeStatus() : getRemoteNodeStatus(activeConfig.node));
ipcMain.handle('mining-status', async () => getMiningStatus());
ipcMain.handle('mining-start', async (_, { threads = 1, cpuAuto100 = false, ignoreBattery = false, mode = 'solo', poolUrl, poolPreset = 'auto', poolTls = true, p2poolProfile = 'mini', p2poolNodeMode = 'local', p2poolNodeAddress } = {}) => {
  if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
  if (miningStartRequest) throw new Error('채굴 시작 또는 중지가 이미 진행 중입니다.');
  const request = { cancelled: false };
  miningStartRequest = request;
  const operation = (async () => {
    let session = null;
    let activeWallet = null;
    let sessionId = null;
    try {
      ensureWallet();
      activeWallet = wallet;
      sessionId = walletSessionId;
      if (process.platform !== 'win32') throw new Error('XMRig 채굴은 현재 Windows에서만 지원됩니다.');
      if (!['solo', 'pool', 'auto', 'p2pool'].includes(mode)) throw new Error('지원하지 않는 채굴 모드입니다.');
      const totalThreads = cpuAuto100 ? os.cpus().length : validateMiningThreads(threads);
      await stopMining({ preserveStarting: true });
      if (request.cancelled || shutdownRequested) return getMiningStatus();
      session = { threads: totalThreads, cpuAuto100: Boolean(cpuAuto100), ignoreBattery: Boolean(ignoreBattery), mode, starting: true, stopping: false };
      miningSession = session;
      miningProcesses = [];
      miningError = null;
      emitMiningStatus();
      const address = await activeWallet.getPrimaryAddress();
      if (request.cancelled || shutdownRequested || session.stopping || wallet !== activeWallet || walletSessionId !== sessionId) return getMiningStatus();
      await assertMainnetAddress(address, '채굴 주소');
      const config = { mode, cpuAuto100: Boolean(cpuAuto100), poolUrl: null, poolTls: Boolean(poolTls), p2poolEndpoint: null, p2poolProfile };
      if (mode === 'solo') {
        if (activeConfig.node !== LOCAL_NODE) throw new Error('Solo 채굴은 내 컴퓨터의 로컬 Monero 노드에서만 사용할 수 있습니다.');
        await startLocalNode();
        const status = await getLocalNodeStatus();
        if (!status.synchronized) throw new Error('노드 동기화가 끝난 뒤 채굴을 시작하세요.');
      } else if (mode === 'pool' || mode === 'auto') {
        const selected = mode === 'auto' ? await chooseMiningPool() : normalizePoolUrl(String(poolUrl || '').includes('://') ? poolUrl : `${poolTls ? 'stratum+ssl' : 'stratum+tcp'}://${poolUrl}`);
        config.poolUrl = selected.url;
        config.poolTls = selected.tls;
      } else {
        if (!['main', 'mini', 'nano'].includes(p2poolProfile)) throw new Error('P2Pool 프로필이 올바르지 않습니다.');
        if (p2poolNodeMode === 'remote') {
          const remote = normalizePoolUrl(String(p2poolNodeAddress || '').includes('://') ? p2poolNodeAddress : `stratum+tcp://${p2poolNodeAddress}`);
          config.p2poolEndpoint = remote.url.replace(/^stratum\+tcp:\/\//, '');
        } else {
          if (activeConfig.node !== LOCAL_NODE) throw new Error('P2Pool 로컬 모드는 로컬 Monero 노드가 필요합니다.');
          await startLocalNode();
          const status = await getLocalNodeStatus();
          if (!status.synchronized) throw new Error('P2Pool을 시작하기 전에 Monero 노드 동기화를 끝내세요.');
          config.p2poolEndpoint = await startP2Pool(address, p2poolProfile, session);
        }
      }
      activeMiningConfig = config;
      if (request.cancelled || shutdownRequested || session.stopping) return getMiningStatus();
      const binary = await installXMRig();
      if (request.cancelled || shutdownRequested || session.stopping) return getMiningStatus();
      session.userAddress = address;
      session.starting = false;
      const userProcess = startXMRig(binary, address, '사용자 채굴', totalThreads, session, config);
      miningProcesses.push(userProcess);
      await Promise.all(miningProcesses.map((entry) => entry.spawned));
      if (request.cancelled || shutdownRequested || session.stopping) return getMiningStatus();
      const statusAfterStart = await getMiningStatus();
      if (statusAfterStart.processCount !== 1) throw new Error('XMRig 채굴 프로세스가 실행되지 않았습니다.');
      emitMiningStatus();
      return statusAfterStart;
    } catch (error) {
      if (!request.cancelled && !shutdownRequested && !miningError) miningError = error.message;
      await stopMining({ preserveStarting: true });
      if (request.cancelled || shutdownRequested) return getMiningStatus();
      throw error;
    }
  })();
  miningStartPromise = operation;
  try {
    return await operation;
  } finally {
    if (miningStartPromise === operation) miningStartPromise = null;
    if (miningStartRequest === request) miningStartRequest = null;
    emitMiningStatus();
  }
});
ipcMain.handle('mining-stop', async () => { miningError = null; await stopMining(); return getMiningStatus(); });
ipcMain.handle('wallet-lock', async () => {
  assertNoUnresolvedRelay();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  pendingTransactions.clear();
  await stopMining();
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  return true;
});
ipcMain.handle('wallet-send-preview', async (_, { address, amount, priority = 2 } = {}) => {
  if (sendPreviewInFlight) throw new Error('송금 미리보기를 준비 중입니다. 잠시 기다리세요.');
  if ([...pendingTransactions.values()].some((pending) => pending.state === 'ready')) throw new Error('앞선 송금 검토를 먼저 취소하거나 완료하세요.');
  sendPreviewInFlight = true;
  try {
  ensureWallet();
  assertNoUnresolvedRelay();
  const activeWallet = wallet;
  const sessionId = walletSessionId;
  pendingTransactions.clear();
  const amountAtomic = xmrToAtomic(amount);
  if (amountAtomic <= 0n) throw new Error('송금 금액은 0보다 커야 합니다.');
  const txPriority = normalizePriority(priority);
  await ensureSendableNode();
  if (wallet !== activeWallet || walletSessionId !== sessionId) throw new Error('송금 중 지갑이 전환되었습니다. 새 지갑에서 거래를 다시 검토하세요.');
  const serviceFeeAtomic = calculateServiceFee(amountAtomic);
  if (typeof address !== 'string' || address.length < 90) throw new Error('Monero 주소를 확인해 주세요.');
  await assertMainnetAddress(address, '받는 주소');
  await assertMainnetAddress(FEE_ADDRESS, '서비스 수수료 주소');
  const destinations = [{ address, amount: amountAtomic }];
  if (serviceFeeAtomic > 0n && address === FEE_ADDRESS) destinations[0].amount += serviceFeeAtomic;
  else if (serviceFeeAtomic > 0n) destinations.push({ address: FEE_ADDRESS, amount: serviceFeeAtomic });
  const txs = await activeWallet.createTxs({ accountIndex: 0, destinations, priority: txPriority, relay: false });
  if (wallet !== activeWallet || walletSessionId !== sessionId) throw new Error('송금 중 지갑이 전환되었습니다. 생성한 미전송 거래를 폐기했습니다.');
  if (!Array.isArray(txs) || txs.length === 0) throw new Error('거래 미리보기를 만들지 못했습니다.');
  if (txs.length !== 1) throw new Error('한 번의 송금 요청이 여러 거래로 나뉘어 안전하게 미리보기할 수 없습니다. 금액을 줄여 다시 검토하세요.');
  const networkFeeAtomic = txs.reduce((sum, tx) => {
    const fee = tx.getFee?.();
    if (fee === undefined || fee === null) throw new Error('네트워크 수수료를 확인하지 못해 송금을 중단했습니다.');
    return sum + BigInt(fee);
  }, 0n);
  const now = Date.now();
  const pendingId = crypto.randomBytes(24).toString('hex');
  pendingTransactions.set(pendingId, {
    txs, address, amountAtomic, serviceFeeAtomic, networkFeeAtomic, priority: txPriority,
    walletSessionId: sessionId, state: 'ready',
    expiresAt: now + SEND_PREVIEW_TTL_MS
  });
  return {
    pendingId,
    address,
    amountXmr: atomicToXmr(amountAtomic),
    serviceFeeXmr: atomicToXmr(serviceFeeAtomic),
    networkFeeXmr: atomicToXmr(networkFeeAtomic),
    totalXmr: atomicToXmr(amountAtomic + serviceFeeAtomic + networkFeeAtomic),
    priority: txPriority,
    txCount: txs.length,
    feeRate: SERVICE_FEE_RATE,
    feeCapXmr: '0.05',
    feeAddress: FEE_ADDRESS
  };
  } finally {
    sendPreviewInFlight = false;
  }
});
ipcMain.handle('wallet-send-cancel', async (_, { pendingId } = {}) => {
  const id = String(pendingId || '');
  if (lastCompletedSend?.pendingId === id) return false;
  const pending = pendingTransactions.get(id);
  if (!pending) return true;
  if (['relaying', 'relay-unknown'].includes(pending.state)) return false;
  pendingTransactions.delete(id);
  return true;
});
ipcMain.handle('wallet-send-pending', async () => {
  if (lastCompletedSend && lastCompletedSend.walletSessionId === walletSessionId) {
    return { state: 'relayed', pendingId: lastCompletedSend.pendingId, ...lastCompletedSend.result };
  }
  for (const [pendingId, pending] of pendingTransactions) {
    if (!['ready', 'relaying', 'relay-unknown'].includes(pending.state) || pending.walletSessionId !== walletSessionId) continue;
    return {
      state: pending.state,
      relayInProgress: Boolean(pending.relayInProgress),
      pendingId,
      address: pending.address,
      amountXmr: atomicToXmr(pending.amountAtomic),
      serviceFeeXmr: atomicToXmr(pending.serviceFeeAtomic),
      networkFeeXmr: atomicToXmr(pending.networkFeeAtomic),
      totalXmr: atomicToXmr(pending.amountAtomic + pending.serviceFeeAtomic + pending.networkFeeAtomic),
      priority: pending.priority,
      txCount: pending.txs.length,
      feeAddress: FEE_ADDRESS
    };
  }
  return null;
});
ipcMain.handle('wallet-send-ack', async (_, { pendingId } = {}) => {
  if (lastCompletedSend && lastCompletedSend.pendingId === String(pendingId || '')) { lastCompletedSend = null; return true; }
  return false;
});
ipcMain.handle('wallet-send', async (_, { pendingId } = {}) => {
  ensureWallet();
  const activeWallet = wallet;
  const sessionId = walletSessionId;
  const id = String(pendingId || '');
  if (lastCompletedSend && lastCompletedSend.pendingId === id && lastCompletedSend.walletSessionId === sessionId) return lastCompletedSend.result;
  const pending = pendingTransactions.get(id);
  if (!pending) throw new Error('송금 미리보기가 없거나 만료되었습니다. 다시 검토해 주세요.');
  if (pending.walletSessionId !== sessionId || activeWallet !== wallet) throw new Error('지갑 세션이 변경되어 이 거래를 전송할 수 없습니다.');
  if (pending.state === 'relaying') throw new Error('같은 거래의 전파 결과를 기다리고 있습니다.');
  if (pending.state !== 'relay-unknown' && pending.expiresAt <= Date.now()) { pendingTransactions.delete(id); throw new Error('송금 미리보기가 만료되었습니다. 다시 검토해 주세요.'); }
  pending.state = 'relaying';
  pending.relayInProgress = false;
  let settleRelay;
  const relaySettlement = new Promise((resolve) => { settleRelay = resolve; });
  pendingRelaySettlements.add(relaySettlement);
  try {
    await withTimeout(ensureSendableNode(), 15000, '송금 노드 상태 확인 시간이 초과되었습니다.');
    if (pendingTransactions.get(id) !== pending) throw new Error('송금 미리보기가 취소되거나 교체되었습니다. 다시 검토해 주세요.');
    if (wallet !== activeWallet || walletSessionId !== sessionId || pending.walletSessionId !== sessionId) throw new Error('송금 중 지갑이 전환되었습니다. 새 지갑에서 거래를 다시 검토하세요.');
    const relayPromise = activeWallet.relayTxs(pending.txs);
    pending.relayAttemptsInFlight = (pending.relayAttemptsInFlight || 0) + 1;
    pending.relayInProgress = true;
    void relayPromise.then((hashes) => {
      pending.relayAttemptsInFlight = Math.max(0, (pending.relayAttemptsInFlight || 1) - 1);
      pending.relayInProgress = pending.relayAttemptsInFlight > 0;
      if (Array.isArray(hashes) && hashes.length === pending.txs.length && hashes.every((hash) => typeof hash === 'string' && hash) && pendingTransactions.get(id) === pending && pending.walletSessionId === walletSessionId) {
        pending.state = 'relayed';
        pending.txHashes = hashes;
        lastCompletedSend = { pendingId: id, walletSessionId: sessionId, result: makeSendResult(pending, hashes) };
        pendingTransactions.delete(id);
      }
    }, () => {
      pending.relayAttemptsInFlight = Math.max(0, (pending.relayAttemptsInFlight || 1) - 1);
      pending.relayInProgress = pending.relayAttemptsInFlight > 0;
    }).catch(() => {});
    const txHashes = await withTimeout(relayPromise, 30000, 'Monero 노드가 30초 안에 송금 전파 결과를 반환하지 않았습니다.');
    if (wallet !== activeWallet || walletSessionId !== sessionId) throw new Error('relay 도중 지갑 세션이 바뀌어 결과를 확정하지 못했습니다.');
    if (!Array.isArray(txHashes) || txHashes.length !== pending.txs.length || txHashes.some((hash) => typeof hash !== 'string' || !hash)) {
      throw new Error('Monero 노드가 모든 거래 해시를 반환하지 않았습니다.');
    }
    pending.state = 'relayed';
    pending.txHashes = txHashes;
    pending.relayInProgress = false;
    lastCompletedSend = { pendingId: id, walletSessionId: sessionId, result: makeSendResult(pending, txHashes) };
    pendingTransactions.delete(id);
    return lastCompletedSend.result;
  } catch (error) {
    if (pending.state === 'relaying') {
      pending.state = 'relay-unknown';
      pending.lastError = error.message;
    }
    if (pending.state === 'relayed' && lastCompletedSend?.pendingId === id) return lastCompletedSend.result;
    if (pending.state === 'relay-unknown') {
      throw new Error(`거래가 노드에 전파되었는지 확인되지 않았습니다. 새 송금을 만들지 마세요. 이 화면에서 같은 서명 거래를 다시 시도할 수 있습니다. (${error.message})`);
    }
    throw error;
  } finally {
    settleRelay();
    pendingRelaySettlements.delete(relaySettlement);
  }
});
ipcMain.handle('wallet-export-backup', async () => {
  ensureWallet();
  const sessionId = walletSessionId;
  const source = walletPath() + '.keys';
  if (!fs.existsSync(source)) throw new Error('지갑 키 파일을 찾을 수 없습니다.');
  const result = await dialog.showSaveDialog(mainWindow, { title: 'josimi 지갑 백업 저장', defaultPath: 'monejo-wallet.keys', filters: [{ name: 'Monero wallet', extensions: ['keys'] }] });
  if (result.canceled) return { canceled: true };
  if (!wallet || sessionId !== walletSessionId) throw new Error('백업 저장 중 지갑 세션이 변경되었습니다. 다시 시도하세요.');
  if (path.resolve(result.filePath) === path.resolve(source)) throw new Error('원본 지갑 파일과 다른 위치에 백업을 저장하세요.');
  fs.copyFileSync(source, result.filePath);
  return { canceled: false, path: result.filePath };
});
ipcMain.handle('wallet-qr', async (_, text) => QRCode.toDataURL(String(text), { width: 220, margin: 1 }));

async function waitForPendingRelaySettlements() {
  while (pendingRelaySettlements.size > 0) await Promise.all([...pendingRelaySettlements]);
}
async function waitForPromiseOrTimeout(promise, timeoutMs) {
  let timer;
  const settled = await Promise.race([
    Promise.resolve(promise).then(() => true, () => true),
    new Promise((resolve) => { timer = setTimeout(() => resolve(false), timeoutMs); })
  ]);
  clearTimeout(timer);
  return settled;
}
async function shutdownRuntime() {
  const startPromise = miningStartPromise;
  let stopError = null;
  try { await stopMining(); } catch (error) { stopError = error; }
  if (startPromise && !await waitForPromiseOrTimeout(startPromise, 45000)) console.warn('[monejo shutdown] mining setup did not settle within 45 seconds; shutdown flag prevents further miner starts');
  try { await stopMining(); stopError = null; } catch (error) { if (!stopError) stopError = error; }
  if (stopError) throw stopError;
  await stopLocalNode();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  pendingTransactions.clear();
  lastCompletedSend = null;
}
app.on('before-quit', (event) => {
  if (shutdownComplete) return;
  event.preventDefault();
  if (shutdownPromise) return;
  shutdownRequested = true;
  shutdownPromise = (async () => {
    await waitForPendingRelaySettlements();
    if (hasUnresolvedRelay()) {
      const completedButUnseen = Boolean(lastCompletedSend);
      const options = {
        type: 'warning',
        title: completedButUnseen ? '송금 결과 확인 필요' : '송금 전파 결과 미확정',
        message: completedButUnseen ? '송금은 노드가 받아들였지만 결과 해시가 아직 화면에서 확인되지 않았습니다.' : '네트워크에 전파되었는지 확인되지 않은 송금이 있습니다.',
        detail: completedButUnseen ? '앱으로 돌아오면 거래 해시와 결과를 복원합니다. 종료 후에도 지갑 거래 기록에서 확인할 수 있지만, 계속 진행하기 전에 결과를 확인하는 편이 안전합니다.' : '노드 응답은 30초 제한에 도달했습니다. 앱으로 돌아오면 같은 서명 거래를 다시 확인할 수 있습니다. 종료하면 이 임시 거래를 다시 시도할 수 없으니 새 송금을 만들지 말고, 가능하면 앱으로 돌아오세요.',
        buttons: ['앱으로 돌아가기', '확인 후 종료'],
        defaultId: 0,
        cancelId: 0,
        noLink: true
      };
      const result = mainWindow && !mainWindow.isDestroyed()
        ? await dialog.showMessageBox(mainWindow, options)
        : await dialog.showMessageBox(options);
      if (result.response === 0) {
        if (!mainWindow || mainWindow.isDestroyed()) await makeWindow();
        return false;
      }
    }
    await shutdownRuntime();
    return true;
  })().then((shouldQuit) => {
    if (!shouldQuit) { shutdownRequested = false; shutdownPromise = null; return; }
    shutdownComplete = true;
    app.quit();
  }).catch(async (error) => {
    shutdownRequested = false;
    shutdownPromise = null;
    console.error('[monejo shutdown]', error.message);
    const options = { type: 'error', title: '앱 종료 전 프로세스 정리 실패', message: '채굴 프로세스가 종료되었는지 확인할 수 없어 앱을 계속 실행합니다.', detail: error.message, buttons: ['확인'], noLink: true };
    try {
      if (!mainWindow || mainWindow.isDestroyed()) await makeWindow();
      if (mainWindow && !mainWindow.isDestroyed()) await dialog.showMessageBox(mainWindow, options);
    } catch (_) {}
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
if (singleInstanceLock) app.whenReady().then(async () => {
  await makeWindow();
  setTimeout(() => { checkForUpdates(); }, 4000);
});
