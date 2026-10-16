const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const https = require('node:https');
const { spawn } = require('node:child_process');
const monerojs = require('monero-ts');
const QRCode = require('qrcode');

const FEE_ADDRESS = '42oyVMt9WTyVBNSY81ArA4NotCt7hKxxXQMk32e1tS6oTaxVZv2Y72E83JLV3xBF2e28uF3YiuAYNizNZTACBq1JHfzwUHu';
const SERVICE_FEE_RATE = 0.0025;
const SERVICE_FEE_CAP_ATOMIC = 50000000000n; // 0.05 XMR
const ATOMIC_PER_XMR = 1000000000000n;
const NETWORK = 'mainnet';
const DEFAULT_NODES = [
  // HTTPS is required for the default public endpoint; users can enter their own node.
  'https://node.monerodevs.org:18089'
];
const LOCAL_NODE = 'http://127.0.0.1:18081';
const MONERO_CLI_VERSION = '0.18.5.3';
const MONERO_CLI_URL = 'https://downloads.getmonero.org/cli/win64';
const MONERO_HASHES_URL = 'https://www.getmonero.org/downloads/hashes.txt';
const MONERO_CLI_SHA256 = 'f58f8f803f0141c77f40f327c516e4721f61d112084eb3d6644028cb9680b82a';
const GITHUB_REPOSITORY = 'jokeo132-a11y/monejo';
const GITHUB_API_RELEASES = `https://api.github.com/repos/${GITHUB_REPOSITORY}/releases?per_page=100`;

let mainWindow;
let wallet = null;
let sessionPassword = null;
let activeConfig = { network: NETWORK, node: DEFAULT_NODES[0] };
let daemonProcess = null;
let daemonStatusTimer = null;
let daemonPollInFlight = false;
let selectedWalletDir = null;
let selectedNodeDir = null;
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
  const match = String(checksumText).match(/([a-f0-9]{64})\s+.*monejo\.exe/i);
  return match ? match[1].toLowerCase() : null;
}

function postJson(url, body, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 3) return reject(new Error('노드 RPC 리디렉션이 너무 많습니다.'));
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const payload = Buffer.from(JSON.stringify(body));
    const request = transport.request(parsed, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }, timeout: 5000 }, (response) => {
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) { response.resume(); return postJson(new URL(response.headers.location, url).toString(), body, redirects + 1).then(resolve, reject); }
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

async function extractZip(zipPath, destination) {
  await fs.promises.mkdir(destination, { recursive: true });
  await new Promise((resolve, reject) => {
    const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
    const command = `$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath ${quote(zipPath)} -DestinationPath ${quote(destination)} -Force`;
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true });
    let errorText = ''; child.stderr.on('data', (chunk) => { errorText += chunk.toString(); });
    child.on('error', reject); child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Monero CLI 압축 해제 실패: ${errorText.trim()}`)));
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
  const hashes = (await requestUrl(MONERO_HASHES_URL)).toString('utf8');
  const escapedVersion = MONERO_CLI_VERSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expectedMatch = hashes.match(new RegExp(`([a-f0-9]{64})\\s+monero-win-x64-v${escapedVersion}\\.zip`, 'i'));
  if (!expectedMatch || expectedMatch[1].toLowerCase() !== MONERO_CLI_SHA256 || actualHash !== MONERO_CLI_SHA256) { await fs.promises.rm(archive, { force: true }); throw new Error('공식 Monero CLI ZIP의 SHA-256 검증에 실패했습니다.'); }
  await extractZip(archive, extracted);
  const found = findFile(extracted, 'monerod.exe');
  if (!found) throw new Error('Monero CLI ZIP에서 monerod.exe를 찾지 못했습니다.');
  await fs.promises.mkdir(path.dirname(binary), { recursive: true });
  await fs.promises.cp(path.dirname(found), path.dirname(binary), { recursive: true, force: true });
  if (!fs.existsSync(binary)) throw new Error('Monero CLI 파일을 설치했지만 monerod.exe가 없습니다.');
  await fs.promises.rm(extracted, { recursive: true, force: true }); await fs.promises.rm(archive, { force: true });
  return binary;
}

async function startLocalNode() {
  const binary = await installLocalNode();
  const existing = await getLocalNodeStatus();
  if (existing.state !== 'stopped') return existing;
  const dataDir = path.join(nodeDataDir(), 'blockchain'); await fs.promises.mkdir(dataDir, { recursive: true });
  daemonProcess = spawn(binary, ['--data-dir', dataDir, '--prune-blockchain', '--rpc-bind-ip', '127.0.0.1', '--rpc-bind-port', '18081', '--non-interactive', '--no-igd'], { cwd: path.dirname(binary), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  daemonProcess.on('error', (error) => { console.warn('[monejo monerod]', error.message); daemonProcess = null; });
  daemonProcess.on('close', () => { daemonProcess = null; emitNodeStatus({ mode: 'local', state: 'stopped', synchronized: false, height: 0, targetHeight: 0, progress: 0, node: LOCAL_NODE }); });
  daemonStatusTimer = setInterval(() => { pollLocalNode(); }, 3000); daemonStatusTimer.unref?.();
  for (let attempt = 0; attempt < 30; attempt += 1) { const status = await getLocalNodeStatus(); if (status.state !== 'stopped' && status.state !== 'starting') return status; await new Promise((resolve) => setTimeout(resolve, 1000)); }
  throw new Error('로컬 Monero 노드가 시작되지 않았습니다. 로그와 방화벽 설정을 확인하세요.');
}

async function resolveNode(node) { return String(node || '').trim() ? normalizeNode(node) : (await startLocalNode(), LOCAL_NODE); }
async function stopLocalNode() { if (daemonStatusTimer) clearInterval(daemonStatusTimer); daemonStatusTimer = null; if (daemonProcess) { daemonProcess.kill(); daemonProcess = null; } }

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
    const exeAsset = release.assets?.find((asset) => asset.name === 'monejo.exe');
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
  for (const file of files) fs.renameSync(path.join(walletDir(), file), path.join(archive, file));
  return archive;
}
function tempWalletPath(prefix) { return path.join(walletDir(), `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`); }
function promoteWallet(tempPath) {
  const archived = archiveExistingWallet();
  try {
    for (const file of walletFiles(tempPath)) fs.renameSync(path.join(walletDir(), file), path.join(walletDir(), file.replace(path.basename(tempPath), 'monejo-wallet')));
  } catch (error) {
    removeWalletFiles();
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
function atomicToXmr(value) { return (BigInt(value) / 1000000000000n).toString() + '.' + (BigInt(value) % 1000000000000n).toString().padStart(12, '0').replace(/0+$/, '').padEnd(1, '0'); }
function xmrToAtomic(value) {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d{1,12})?$/.test(normalized)) throw new Error('XMR 금액 형식이 올바르지 않습니다.');
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * ATOMIC_PER_XMR + BigInt((fraction + '000000000000').slice(0, 12));
}
function normalizeNode(node) {
  const value = String(node || DEFAULT_NODES[0]).trim();
  let parsed;
  try { parsed = new URL(value); } catch (_) { throw new Error('노드 주소 형식이 올바르지 않습니다.'); }
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !local) throw new Error('개인정보 보호를 위해 HTTPS 노드만 사용할 수 있습니다.');
  return parsed.toString().replace(/\/$/, '');
}
function assertMainnetNetwork(network) {
  if (network !== NETWORK) throw new Error('monejo는 mainnet 전용 지갑입니다.');
}
function calculateServiceFee(amountAtomic) {
  const computed = (amountAtomic * 25n) / 10000n;
  return computed > SERVICE_FEE_CAP_ATOMIC ? SERVICE_FEE_CAP_ATOMIC : computed;
}
async function assertMainnetAddress(address, label) {
  if (!(await monerojs.MoneroUtils.isValidAddress(address, 'mainnet'))) throw new Error(`${label}가 유효한 Monero mainnet 주소가 아닙니다.`);
}
function ensureWallet() { if (!wallet) throw new Error('먼저 지갑을 열거나 생성해 주세요.'); }
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
async function loadSummary() {
  ensureWallet();
  const address = await wallet.getPrimaryAddress();
  const balance = await wallet.getBalance(0);
  let txs = [];
  try { txs = await wallet.getTxs({ accountIndex: 0 }); } catch (_) {}
  const sync = activeConfig.node === LOCAL_NODE ? await getLocalNodeStatus() : await getRemoteNodeStatus(activeConfig.node);
  return { address, balance: balance.toString(), balanceXmr: atomicToXmr(balance), txs: txs.slice(-30).reverse().map(safeTx), network: activeConfig.network, node: activeConfig.node, sync };
}
async function makeWindow() {
  mainWindow = new BrowserWindow({ width: 1180, height: 820, minWidth: 980, minHeight: 680, backgroundColor: '#0b0b0b', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('file://')) event.preventDefault(); });
  await mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('app-config', () => ({ feeAddress: FEE_ADDRESS, feeRate: SERVICE_FEE_RATE, feeCapXmr: '0.05', network: activeConfig.network, defaultNodes: DEFAULT_NODES, localNode: LOCAL_NODE, localNodeSupported: process.platform === 'win32' }));
ipcMain.handle('wallet-create', async (_, { password, node, network = NETWORK }) => {
  if (!password || password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
  assertMainnetNetwork(network);
  if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
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
    sessionPassword = password;
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
  if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
  activeConfig = { network: NETWORK, node: await resolveNode(node) };
  const normalizedRestoreHeight = normalizeRestoreHeight(restoreHeight);
  const recoveryPath = tempWalletPath('monejo-recovery');
  let recovered; let archived = null;
  try {
    recovered = await monerojs.createWalletFull({ path: recoveryPath, password, networkType: network, seed: normalizedSeed, seedOffset: String(seedOffset || '').trim() || undefined, restoreHeight: normalizedRestoreHeight, server: activeConfig.node });
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
  sessionPassword = password;
  return { ...(await loadSummary()), restored: true, restoreHeightUsed: normalizedRestoreHeight, recoveryNote: '기존 지갑은 복구 전 자동 보관되었습니다.' };
});
ipcMain.handle('wallet-open', async (_, { password, node, network = NETWORK }) => {
  if (!fs.existsSync(walletPath() + '.keys')) throw new Error('저장된 monejo 지갑이 없습니다. 새로 만들거나 seed로 복구하세요.');
  assertMainnetNetwork(network);
  if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
  activeConfig = { network: NETWORK, node: await resolveNode(node) };
  try {
    wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
    sessionPassword = password;
    return await loadSummary();
  } catch (error) {
    if (wallet) await wallet.close(true).catch(() => {});
    wallet = null;
    sessionPassword = null;
    throw error;
  }
});
ipcMain.handle('wallet-refresh', async () => loadSummary());
ipcMain.handle('node-status', async () => activeConfig.node === LOCAL_NODE ? getLocalNodeStatus() : getRemoteNodeStatus(activeConfig.node));
ipcMain.handle('wallet-lock', async () => { if (wallet) await wallet.close(true).catch(() => {}); wallet = null; sessionPassword = null; return true; });
ipcMain.handle('wallet-send-preview', async (_, { address, amount }) => {
  ensureWallet();
  const amountAtomic = xmrToAtomic(amount);
  if (amountAtomic <= 0n) throw new Error('송금 금액은 0보다 커야 합니다.');
  const serviceFeeAtomic = calculateServiceFee(amountAtomic);
  if (!address || address.length < 90) throw new Error('Monero 주소를 확인해 주세요.');
  await assertMainnetAddress(address, '받는 주소');
  await assertMainnetAddress(FEE_ADDRESS, '서비스 수수료 주소');
  return { address, amountXmr: amount, amountAtomic: amountAtomic.toString(), serviceFeeXmr: atomicToXmr(serviceFeeAtomic), serviceFeeAtomic: serviceFeeAtomic.toString(), feeRate: SERVICE_FEE_RATE, feeCapXmr: '0.05', feeAddress: FEE_ADDRESS, totalBeforeNetworkFeeXmr: atomicToXmr(amountAtomic + serviceFeeAtomic) };
});
ipcMain.handle('wallet-send', async (_, { address, amount, priority = 2 }) => {
  ensureWallet();
  const amountAtomic = xmrToAtomic(amount);
  if (amountAtomic <= 0n) throw new Error('송금 금액은 0보다 커야 합니다.');
  const txPriority = normalizePriority(priority);
  await ensureSendableNode();
  const serviceFeeAtomic = calculateServiceFee(amountAtomic);
  await assertMainnetAddress(address, '받는 주소');
  await assertMainnetAddress(FEE_ADDRESS, '서비스 수수료 주소');
  const destinations = [{ address, amount: amountAtomic.toString() }];
  if (serviceFeeAtomic > 0n) destinations.push({ address: FEE_ADDRESS, amount: serviceFeeAtomic.toString() });
  const txs = await wallet.createTxs({ accountIndex: 0, destinations, priority: txPriority, relay: true });
  return { txs: txs.map(safeTx), serviceFeeXmr: atomicToXmr(serviceFeeAtomic) };
});
ipcMain.handle('wallet-export-backup', async () => {
  ensureWallet();
  const source = walletPath() + '.keys';
  if (!fs.existsSync(source)) throw new Error('지갑 키 파일을 찾을 수 없습니다.');
  const result = await dialog.showSaveDialog(mainWindow, { title: 'monejo 지갑 백업 저장', defaultPath: 'monejo-wallet.keys', filters: [{ name: 'Monero wallet', extensions: ['keys'] }] });
  if (result.canceled) return { canceled: true };
  if (path.resolve(result.filePath) === path.resolve(source)) throw new Error('원본 지갑 파일과 다른 위치에 백업을 저장하세요.');
  fs.copyFileSync(source, result.filePath);
  return { canceled: false, path: result.filePath };
});
ipcMain.handle('wallet-qr', async (_, text) => QRCode.toDataURL(String(text), { width: 220, margin: 1 }));

if (singleInstanceLock) app.whenReady().then(async () => {
  await makeWindow();
  setTimeout(() => { checkForUpdates(); }, 4000);
});
app.on('window-all-closed', async () => { if (wallet) await wallet.close(true).catch(() => {}); await stopLocalNode(); if (process.platform !== 'darwin') app.quit(); });
