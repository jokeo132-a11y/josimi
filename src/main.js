const { app, BrowserWindow, ipcMain: electronIpcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const https = require('node:https');
const { pathToFileURL } = require('node:url');
const monerojs = require('monero-ts');
const QRCode = require('qrcode');
const { atomicToXmr, xmrToAtomic, calculateServiceFee, isValidMoneroTxHash, normalizeWalletIndex, normalizeWalletLabel, normalizeTransactionNote, validateWalletPassword, isRelayAttemptInProgress, waitForPromiseOrTimeout, isAllowedNodeRedirect, isMoneroKeysFile, canAppendResponseBytes } = require('./core');
const { LocalNodeManager, MONERO_VERSION, RPC_HOST, RPC_PORT, waitForRpcReady } = require('./node-manager');
const { RelayGuardStore } = require('./relay-guard');
const { WalletOperationGate } = require('./wallet-operation-gate');
const { installPermissionPolicy } = require('./permission-policy');

const FEE_ADDRESS = '47ky8dusihATq9gGbQiEL9dMUfBKzgEm5ExF7yx8ANxvBVDe57e58kY1FV56zyx1CUFUJwT6YqB4XJWnAV9HiKp2MkmSkNt';
const SERVICE_FEE_RATE = 0.0025;
const SEND_PREVIEW_TTL_MS = 5 * 60 * 1000;
const LOCAL_NODE_URL = `http://${RPC_HOST}:${RPC_PORT}`;
const MAX_NODE_RPC_RESPONSE_BYTES = 512 * 1024;
const NODE_RPC_DEADLINE_MS = 8_000;
const WALLET_LIFECYCLE_NODE_PROBE_TIMEOUT_MS = 1_000;
const WALLET_SYNC_START_TIMEOUT_MS = 1_500;
const NETWORK = 'mainnet';
const DEFAULT_NODES = [
  // HTTPS is required for the default public endpoint; users can enter their own node.
  'https://node.monerodevs.org:18089'
];
const APP_URL = pathToFileURL(path.join(__dirname, 'index.html')).href;

let mainWindow;
let wallet = null;
let activeConfig = { network: NETWORK, node: DEFAULT_NODES[0] };
let shutdownRequested = false;
let selectedWalletDir = null;
let selectedWalletPath = null;
let localNodeManager = null;
let persistentRelayGuard = null;
let pendingTransactions = new Map();
let walletSessionId = 0;
let lastCompletedSend = null;
let sendPreviewInFlight = false;
const pendingRelaySettlements = new Set();
let shutdownPromise = null;
let shutdownComplete = false;
let walletSyncRetryTimer = null;
let walletSyncRetryDelayMs = 5_000;

function registerIpcHandler(channel, handler) {
  electronIpcMain.handle(channel, (event, ...args) => {
    const frame = event.senderFrame;
    if (!frame || frame !== event.sender.mainFrame || frame.url !== APP_URL) throw new Error('허용되지 않은 IPC 요청입니다.');
    return handler(event, ...args);
  });
}
const ipcMain = { handle: registerIpcHandler };
const walletOperationGate = new WalletOperationGate();
function registerWalletOperationHandler(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    if (shutdownRequested) return Promise.reject(new Error('앱 종료가 진행 중입니다.'));
    return walletOperationGate.run(() => handler(event, ...args));
  });
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();
else app.on('second-instance', () => { if (mainWindow && !mainWindow.isDestroyed()) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });

function postJson(url, body, redirects = 0, deadline = Date.now() + NODE_RPC_DEADLINE_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      error ? reject(error) : resolve(value);
    };
    const remaining = deadline - Date.now();
    if (remaining <= 0) return finish(new Error('노드 RPC 전체 요청 시간이 초과되었습니다.'));
    if (redirects > 3) return finish(new Error('노드 RPC 리디렉션이 너무 많습니다.'));
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const payload = Buffer.from(JSON.stringify(body));
    const request = transport.request(parsed, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length } }, (response) => {
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
        const nextUrl = new URL(response.headers.location, url).toString();
        response.resume();
        if (!isAllowedNodeRedirect(url, nextUrl)) return finish(new Error('노드 RPC 리디렉션의 프로토콜 또는 주소가 변경되어 연결을 차단했습니다.'));
        return postJson(nextUrl, body, redirects + 1, deadline).then((value) => finish(null, value), finish);
      }
      if (response.statusCode < 200 || response.statusCode >= 300) { response.resume(); return finish(new Error(`노드 RPC 응답 오류 (${response.statusCode})`)); }
      const declaredLength = Number(response.headers['content-length'] || 0);
      if (declaredLength > MAX_NODE_RPC_RESPONSE_BYTES) {
        response.destroy();
        return finish(new Error('노드 RPC 응답이 허용 크기(512 KiB)를 초과했습니다.'));
      }
      const chunks = [];
      let responseBytes = 0;
      response.on('data', (chunk) => {
        if (!canAppendResponseBytes(responseBytes, chunk.length, MAX_NODE_RPC_RESPONSE_BYTES)) {
          response.destroy();
          return finish(new Error('노드 RPC 응답이 허용 크기(512 KiB)를 초과했습니다.'));
        }
        responseBytes += chunk.length;
        chunks.push(chunk);
      });
      response.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid response');
          if (data.error) throw new Error(typeof data.error.message === 'string' ? data.error.message : 'JSON-RPC error');
          finish(null, data);
        } catch (error) { finish(new Error(`노드 RPC 응답을 해석할 수 없습니다. (${error.message})`)); }
      });
      response.on('error', finish);
    });
    const deadlineTimer = setTimeout(() => request.destroy(new Error('노드 RPC 전체 요청 시간이 초과되었습니다.')), remaining);
    request.setTimeout(Math.min(5_000, remaining), () => request.destroy(new Error('노드 RPC 연결이 5초 동안 응답하지 않았습니다.')));
    request.on('close', () => clearTimeout(deadlineTimer));
    request.on('error', finish);
    request.end(payload);
  });
}

function portableDataDir() {
  if (!app.isPackaged) return path.join(app.getPath('userData'), 'josimi');
  const executableDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
  return path.join(executableDir, 'josimi');
}
function bundledRuntimePath(...parts) {
  const root = app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : path.join(__dirname, '..');
  return path.join(root, 'assets', 'runtime', ...parts);
}
function getLocalNodeManager() {
  if (!localNodeManager) {
    localNodeManager = new LocalNodeManager({ root: path.join(app.getPath('userData'), 'local-node'), bundledRuntimeDir: bundledRuntimePath('monero') });
    localNodeManager.on('status', (status) => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('local-node-status', status);
    });
  }
  return localNodeManager;
}
async function getLocalNodeManagerStatus() {
  const manager = getLocalNodeManager();
  const local = manager.getStatus();
  const rpc = local.running ? await getRemoteNodeStatus(LOCAL_NODE_URL) : { mode: 'local', node: LOCAL_NODE_URL, state: 'stopped', synchronized: null, height: 0, targetHeight: 0, progress: 0, peers: 0 };
  return { ...local, rpc };
}
async function stopLocalNode() {
  const manager = getLocalNodeManager();
  return manager.stop(() => postJson(`${LOCAL_NODE_URL}/stop_daemon`, {}));
}
function hasWalletData(dir) {
  try { return fs.readdirSync(dir).some((name) => name === 'josimi-wallet.keys' || name.startsWith('josimi-wallet.')); } catch (_) { return false; }
}
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

async function getNodeInfo(node) {
  const response = await postJson(`${node}/json_rpc`, { jsonrpc: '2.0', id: 'josimi', method: 'get_info' });
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

async function getRemoteNodeStatus(node, timeoutMs = NODE_RPC_DEADLINE_MS) {
  const mode = (() => { try { return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(new URL(node).hostname) ? 'local' : 'remote'; } catch (_) { return 'remote'; } })();
  try {
    const info = await withTimeout(getNodeInfo(node), timeoutMs, 'Node status request timed out');
    const height = Number(info.height || 0); const targetHeight = Number(info.target_height || height);
    const synchronized = typeof info.synchronized === 'boolean' ? info.synchronized : null;
    return { mode, node, state: synchronized === true ? 'synced' : synchronized === false ? 'syncing' : mode === 'local' ? 'local' : 'remote', synchronized, height, targetHeight, progress: targetHeight ? Math.min(100, Math.floor((height / targetHeight) * 10000) / 100) : 0, peers: Number(info.outgoing_connections_count || 0) };
  } catch (_) {
    return { mode, node, state: mode === 'local' ? 'stopped' : 'offline', synchronized: null, height: 0, targetHeight: 0, progress: 0, peers: 0 };
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), timeoutMs); })
  ]).finally(() => clearTimeout(timer));
}

async function resolveNode(node) { return normalizeNode(String(node || DEFAULT_NODES[0]).trim()); }


function walletDir() {
  if (selectedWalletDir) return selectedWalletDir;
  const legacy = path.join(app.getPath('userData'), 'wallets');
  const current = path.join(portableDataDir(), 'wallets');
  selectedWalletDir = hasWalletData(legacy) && !hasWalletData(current) ? legacy : current;
  fs.mkdirSync(selectedWalletDir, { recursive: true });
  return selectedWalletDir;
}
function walletPath() { return selectedWalletPath || path.join(walletDir(), 'josimi-wallet'); }
function getRelayGuardStore() {
  if (!persistentRelayGuard) persistentRelayGuard = new RelayGuardStore(path.join(app.getPath('userData'), 'relay-recovery.json'));
  return persistentRelayGuard;
}
function relayTxHashes(pending) {
  return (pending.txs || []).map((tx) => { try { return tx.getHash?.(); } catch (_) { return null; } }).filter((hash) => typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash));
}
function persistRelayState(pending, state, txHashes = relayTxHashes(pending)) {
  const hashes = Array.isArray(txHashes) ? txHashes : [];
  if (!Array.isArray(pending.txs) || hashes.length !== pending.txs.length || hashes.some((hash) => !isValidMoneroTxHash(hash))) {
    throw new Error('거래 해시를 복구 기록에 안전하게 저장할 수 없어 relay를 차단했습니다.');
  }
  return getRelayGuardStore().save(pending.walletBase || walletPath(), {
    pendingId: pending.pendingId,
    state,
    txHashes: hashes,
    createdAt: Number.isSafeInteger(pending.createdAt) ? pending.createdAt : Date.now()
  });
}
function hydrateRelayRecovery(walletBase, record) {
  if (!record) return null;
  const pending = {
    pendingId: record.pendingId,
    state: 'relay-unknown',
    txHashes: record.txHashes,
    walletSessionId,
    walletBase: path.resolve(walletBase),
    createdAt: record.createdAt,
    expiresAt: Infinity,
    relayInProgress: false,
    requiresManualReview: true
  };
  pendingTransactions.set(pending.pendingId, pending);
  return pending;
}
function assertNoPersistedRelay(walletBase) {
  if (getRelayGuardStore().get(walletBase)) throw new Error('이 지갑에 이전 송금의 미확정 기록이 있습니다. 앱 내 경고를 확인하고 거래 해시를 대조하기 전에는 새 송금을 만들 수 없습니다.');
}
function keyFilePath(base) { return `${base}.keys`; }
function isRegularFile(filePath) { try { return fs.statSync(filePath).isFile(); } catch (_) { return false; } }
function walletFamilyExists(base) {
  return isRegularFile(base) || isRegularFile(keyFilePath(base)) || isRegularFile(`${base}.address.txt`);
}
function walletFiles(base = walletPath()) {
  const dir = path.dirname(base);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name === path.basename(base) || name.startsWith(`${path.basename(base)}.`));
}
function normalizeWalletBase(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('key 파일 경로가 선택되지 않았습니다.');
  const resolved = path.resolve(filePath.trim());
  const lower = resolved.toLowerCase();
  const hasKeysExtension = lower.endsWith('.keys');
  const hasAddressExtension = lower.endsWith('.address.txt');
  const originalName = path.basename(resolved);
  const suffixLength = hasKeysExtension ? 5 : hasAddressExtension ? 12 : 0;
  const stem = suffixLength ? originalName.slice(0, -suffixLength) : originalName;
  if (!stem || stem === '.' || stem === '..') throw new Error('key 파일 이름이 올바르지 않습니다.');
  const base = suffixLength ? resolved.slice(0, -suffixLength) : resolved;
  return base;
}
function archiveExistingWallet() {
  const files = walletFiles();
  if (!files.length) return null;
  const archive = path.join(walletDir(), `josimi-wallet-before-restore-${Date.now()}`);
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
    for (const file of files) fs.renameSync(path.join(walletDir(), file), path.join(walletDir(), file.replace(path.basename(tempPath), 'josimi-wallet')));
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
  const target = base || walletPath();
  const dir = path.dirname(target);
  for (const file of walletFiles(target)) fs.rmSync(path.join(dir, file), { force: true });
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
function captureWalletSession() {
  ensureWallet();
  return { activeWallet: wallet, sessionId: walletSessionId };
}
function assertWalletSession(activeWallet, sessionId) {
  if (wallet !== activeWallet || walletSessionId !== sessionId) throw new Error('지갑 세션이 변경되어 요청을 취소했습니다.');
}
function hasUnresolvedRelay() { return Boolean(lastCompletedSend) || [...pendingTransactions.values()].some((pending) => !pending.requiresManualReview && ['relaying', 'relay-unknown'].includes(pending.state)); }
function assertNoUnresolvedRelay() {
  if (hasUnresolvedRelay()) throw new Error('앞선 송금 결과를 먼저 확인해야 합니다. 완료된 거래는 해시를 확인하고, 미확정 거래는 같은 서명 거래로 재시도하기 전에는 지갑 전환이나 새 송금을 할 수 없습니다.');
}
function pruneExpiredPreviews() {
  const now = Date.now();
  for (const [pendingId, pending] of pendingTransactions) {
    if (pending.state === 'ready' && pending.expiresAt <= now) pendingTransactions.delete(pendingId);
  }
}
function normalizePriority(priority) {
  const value = Number(priority);
  if (![1, 2, 3].includes(value)) throw new Error('송금 우선순위가 올바르지 않습니다.');
  return value;
}
async function ensureSendableNode() {
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
  return {
    hash: tx.getHash?.(),
    fee: tx.getFee?.()?.toString?.() || '0',
    amount: tx.getAmount?.()?.toString?.() || '0',
    height: tx.getHeight?.(),
    isConfirmed: tx.getIsConfirmed?.() ?? tx.isConfirmed?.(),
    isLocked: tx.getIsLocked?.() ?? tx.isLocked?.(),
    isIncoming: tx.getIsIncoming?.() ?? false,
    isOutgoing: tx.getIsOutgoing?.() ?? false,
    note: tx.getNote?.() || '',
    timestamp: tx.getTimestamp?.()
  };
}
function makeSendResult(pending, txHashes) {
  return { txs: pending.txs.map(safeTx), txHashes, serviceFeeXmr: atomicToXmr(pending.serviceFeeAtomic), networkFeeXmr: atomicToXmr(pending.networkFeeAtomic), totalXmr: atomicToXmr(pending.amountAtomic + pending.serviceFeeAtomic + pending.networkFeeAtomic) };
}
function serializeSubaddress(subaddress) {
  return {
    index: Number(subaddress.getIndex()),
    address: subaddress.getAddress(),
    label: subaddress.getLabel() || '',
    balance: String(subaddress.getBalance() ?? 0),
    unlockedBalance: String(subaddress.getUnlockedBalance() ?? 0),
    isUsed: Boolean(subaddress.getIsUsed())
  };
}
async function loadAccounts(activeWallet = wallet) {
  const accounts = await activeWallet.getAccounts(true);
  return Promise.all(accounts.map(async (account) => {
    const index = Number(account.getIndex());
    const subaddresses = account.getSubaddresses?.() || await activeWallet.getSubaddresses(index);
    return {
      index,
      label: account.getLabel() || '',
      address: account.getPrimaryAddress(),
      balance: String(account.getBalance() ?? 0),
      unlockedBalance: String(account.getUnlockedBalance() ?? 0),
      subaddresses: subaddresses.map(serializeSubaddress)
    };
  }));
}
async function loadAccountsForSession(activeWallet, sessionId) {
  assertWalletSession(activeWallet, sessionId);
  const accounts = await loadAccounts(activeWallet);
  assertWalletSession(activeWallet, sessionId);
  return accounts;
}
async function assertAccountExists(activeWallet, accountIndex) {
  const accounts = await activeWallet.getAccounts(false);
  if (!accounts.some((account) => Number(account.getIndex()) === accountIndex)) throw new Error('선택한 Monero 계정을 찾을 수 없습니다.');
}
async function loadAddressBook(activeWallet = wallet) {
  const entries = await activeWallet.getAddressBookEntries();
  return entries.map((entry) => ({
    index: Number(entry.getIndex()),
    address: entry.getAddress(),
    description: entry.getDescription() || '',
    paymentId: entry.getPaymentId() || ''
  }));
}
async function loadAddressBookForSession(activeWallet, sessionId) {
  assertWalletSession(activeWallet, sessionId);
  const entries = await loadAddressBook(activeWallet);
  assertWalletSession(activeWallet, sessionId);
  return entries;
}
function emitWalletSyncStatus(state) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('wallet-sync-status', { state });
}
function cancelWalletSyncRetry() {
  if (walletSyncRetryTimer) clearTimeout(walletSyncRetryTimer);
  walletSyncRetryTimer = null;
  walletSyncRetryDelayMs = 5_000;
}
async function startWalletBackgroundSync(activeWallet = wallet) {
  if (!activeWallet || typeof activeWallet.startSyncing !== 'function') return { state: 'unavailable' };
  if (walletSyncRetryTimer) clearTimeout(walletSyncRetryTimer);
  walletSyncRetryTimer = null;
  const sessionId = walletSessionId;
  // monero-ts scans in the background and persists its height as blocks arrive.
  try {
    await activeWallet.startSyncing(10_000);
    walletSyncRetryDelayMs = 5_000;
    if (activeWallet === wallet && sessionId === walletSessionId) emitWalletSyncStatus('running');
    return { state: 'running' };
  } catch (error) {
    console.warn('[josimi wallet sync]', error.message);
    if (activeWallet !== wallet || sessionId !== walletSessionId || shutdownRequested) return { state: 'stopped' };
    emitWalletSyncStatus('retrying');
    const delayMs = walletSyncRetryDelayMs;
    walletSyncRetryDelayMs = Math.min(walletSyncRetryDelayMs * 2, 60_000);
    walletSyncRetryTimer = setTimeout(() => {
      walletSyncRetryTimer = null;
      if (activeWallet === wallet && sessionId === walletSessionId && !shutdownRequested) void startWalletBackgroundSync(activeWallet);
    }, delayMs);
    walletSyncRetryTimer.unref?.();
    return { state: 'retrying' };
  }
}
async function startWalletBackgroundSyncWithinDeadline(activeWallet = wallet) {
  return withTimeout(
    startWalletBackgroundSync(activeWallet),
    WALLET_SYNC_START_TIMEOUT_MS,
    'Wallet synchronization startup continues in the background'
  ).catch(() => ({ state: 'starting' }));
}
async function loadSummary({ nodeStatusTimeoutMs = NODE_RPC_DEADLINE_MS } = {}) {
  ensureWallet();
  const activeWallet = wallet;
  const sessionId = walletSessionId;
  const sessionConfig = { network: activeConfig.network, node: activeConfig.node };
  const address = await activeWallet.getPrimaryAddress();
  assertWalletSession(activeWallet, sessionId);
  const balance = await activeWallet.getBalance();
  assertWalletSession(activeWallet, sessionId);
  let txs = [];
  try { txs = await activeWallet.getTxs(); } catch (_) {}
  assertWalletSession(activeWallet, sessionId);
  const sync = await getRemoteNodeStatus(sessionConfig.node, nodeStatusTimeoutMs);
  assertWalletSession(activeWallet, sessionId);
  const accounts = await loadAccountsForSession(activeWallet, sessionId);
  const addressBook = await loadAddressBookForSession(activeWallet, sessionId);
  assertWalletSession(activeWallet, sessionId);
  return { address, balance: balance.toString(), balanceXmr: atomicToXmr(balance), txs: txs.slice().reverse().map(safeTx), accounts, addressBook, network: sessionConfig.network, node: sessionConfig.node, sync, walletSessionId: sessionId };
}
async function makeWindow() {
  mainWindow = new BrowserWindow({ width: 1180, height: 820, minWidth: 980, minHeight: 680, backgroundColor: '#0b0b0b', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  installPermissionPolicy(mainWindow.webContents.session, APP_URL);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => { if (url !== APP_URL) event.preventDefault(); });
  await mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('app-config', () => ({ feeAddress: FEE_ADDRESS, feeRate: SERVICE_FEE_RATE, feeCapXmr: '0.05', network: activeConfig.network, defaultNodes: DEFAULT_NODES, remoteOnly: false, localNodeSupported: process.platform === 'win32', localNodeUrl: LOCAL_NODE_URL, moneroVersion: MONERO_VERSION }));
registerWalletOperationHandler('wallet-file-choose', async (_, { action = 'open' } = {}) => {
  if (action === 'save') {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '새 josimi 지갑 파일 저장 위치 선택',
      defaultPath: path.join(app.getPath('documents'), 'josimi-wallet')
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const base = normalizeWalletBase(result.filePath);
    if (walletFamilyExists(base)) throw new Error('같은 이름의 지갑 파일이 이미 있습니다. 기존 지갑을 열거나 다른 이름을 사용하세요.');
    selectedWalletPath = base;
    return { canceled: false, path: base, fileName: path.basename(base) };
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Monero 지갑 .keys 파일 선택',
    properties: ['openFile'],
    filters: [{ name: 'Monero wallet keys (*.keys)', extensions: ['keys'] }]
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  if (!isMoneroKeysFile(result.filePaths[0])) throw new Error('Monero GUI 지갑의 .keys 파일을 선택하세요.');
  const base = normalizeWalletBase(result.filePaths[0]);
  if (!isRegularFile(keyFilePath(base))) throw new Error('선택한 .keys 파일을 찾을 수 없습니다.');
  selectedWalletPath = base;
  return { canceled: false, path: base, fileName: path.basename(base) };
});
registerWalletOperationHandler('wallet-create', async (_, payload = {}) => {
  const { password, node, network = NETWORK } = payload || {};
  validateWalletPassword(password);
  assertMainnetNetwork(network);
  assertNoUnresolvedRelay();
  assertNoPersistedRelay(walletPath());
  cancelWalletSyncRetry();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  pendingTransactions.clear();
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  activeConfig = { network: NETWORK, node: await resolveNode(node) };
  const creationHeight = await withTimeout(getNodeHeight(activeConfig.node), WALLET_LIFECYCLE_NODE_PROBE_TIMEOUT_MS, 'Optional node height lookup timed out').catch(() => null);
  const customPath = selectedWalletPath;
  if (customPath && walletFamilyExists(customPath)) throw new Error('같은 이름의 지갑 파일이 이미 있습니다. 기존 지갑을 열거나 새 이름을 선택하세요.');
  const creationPath = customPath || tempWalletPath('josimi-create');
  let created; let archived = null;
  try {
    created = await monerojs.createWalletFull({ path: creationPath, password, networkType: network, server: activeConfig.node });
    const createdAddress = await created.getPrimaryAddress();
    await created.close(true);
    if (!customPath) archived = promoteWallet(creationPath);
    wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
    const summary = await loadSummary({ nodeStatusTimeoutMs: WALLET_LIFECYCLE_NODE_PROBE_TIMEOUT_MS });
    const walletSync = await startWalletBackgroundSyncWithinDeadline(wallet);
    if (summary.address !== createdAddress) throw new Error('생성 직후 주소 검증에 실패했습니다. 기존 파일을 사용하지 않도록 작업을 중단했습니다.');
    return { ...summary, createdAtHeight: creationHeight, restoreHeight: creationHeight, walletSyncStartState: walletSync.state };
  } catch (error) {
    if (created) await created.close(true).catch(() => {});
    cancelWalletSyncRetry();
    if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
    removeWalletFiles(creationPath);
    if (archived) { removeWalletFiles(); restoreArchivedWallet(archived); }
    if (customPath) selectedWalletPath = null;
    throw new Error(`지갑 파일을 만들지 못했습니다. 저장 위치와 비밀번호를 확인해 주세요. (${error.message})`);
  }
});
registerWalletOperationHandler('wallet-restore', async (_, payload = {}) => {
  let password = payload?.password;
  let seed = payload?.seed;
  let seedOffset = payload?.seedOffset;
  let normalizedSeed = '';
  let normalizedSeedOffset;
  try {
    const { restoreHeight, node, network = NETWORK } = payload || {};
    validateWalletPassword(password);
    assertMainnetNetwork(network);
    normalizedSeed = normalizeSeed(seed);
    assertNoUnresolvedRelay();
    assertNoPersistedRelay(walletPath());
    cancelWalletSyncRetry();
    const previousWallet = wallet;
    wallet = null;
    walletSessionId += 1;
    pendingTransactions.clear();
      if (previousWallet) await previousWallet.close(true).catch(() => {});
    activeConfig = { network: NETWORK, node: await resolveNode(node) };
    const normalizedRestoreHeight = normalizeRestoreHeight(restoreHeight);
    const customPath = selectedWalletPath;
    if (customPath && walletFamilyExists(customPath)) throw new Error('같은 이름의 지갑 파일이 이미 있습니다. 기존 지갑을 열거나 새 이름을 선택하세요.');
    const recoveryPath = customPath || tempWalletPath('josimi-recovery');
    normalizedSeedOffset = seedOffset === undefined || seedOffset === null || seedOffset === '' ? undefined : String(seedOffset);
    let recovered; let archived = null;
    try {
      recovered = await monerojs.createWalletFull({ path: recoveryPath, password, networkType: network, seed: normalizedSeed, seedOffset: normalizedSeedOffset, restoreHeight: normalizedRestoreHeight, server: activeConfig.node });
      const recoveredAddress = await recovered.getPrimaryAddress();
      await recovered.close(true);
      if (!customPath) archived = promoteWallet(recoveryPath);
      wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
      if (await wallet.getPrimaryAddress() !== recoveredAddress) throw new Error('복구 후 파일 주소 검증에 실패했습니다.');
    } catch (error) {
      if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
      if (recovered) await recovered.close(true).catch(() => {});
      removeWalletFiles(recoveryPath);
      if (archived) { removeWalletFiles(); restoreArchivedWallet(archived); }
      if (customPath) selectedWalletPath = null;
      throw new Error(`seed 복구에 실패했습니다. seed와 네트워크를 다시 확인하세요. (${error.message})`);
    }
    if (!wallet) wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
    const summary = await loadSummary({ nodeStatusTimeoutMs: WALLET_LIFECYCLE_NODE_PROBE_TIMEOUT_MS });
    const walletSync = await startWalletBackgroundSyncWithinDeadline(wallet);
    return { ...summary, restored: true, restoreHeightUsed: normalizedRestoreHeight, walletSyncStartState: walletSync.state, recoveryNote: '기존 지갑은 복구 전 자동 보관되었습니다.' };
  } finally {
    seed = ''; seedOffset = ''; normalizedSeed = ''; normalizedSeedOffset = undefined; password = '';
    if (payload && typeof payload === 'object') { payload.seed = ''; payload.seedOffset = ''; payload.password = ''; }
  }
});
registerWalletOperationHandler('wallet-open', async (_, payload = {}) => {
  const { password, node, network = NETWORK } = payload || {};
  validateWalletPassword(password, 0);
  if (!isRegularFile(walletPath()) && !isRegularFile(keyFilePath(walletPath()))) throw new Error('선택한 파일은 Monero 지갑 파일이 아닙니다. 본체 파일 또는 .keys 파일을 선택하세요.');
  assertMainnetNetwork(network);
  assertNoUnresolvedRelay();
  const recoveryRecord = getRelayGuardStore().get(walletPath());
  cancelWalletSyncRetry();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  pendingTransactions.clear();
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  activeConfig = { network: NETWORK, node: await resolveNode(node) };
  try {
    wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, server: activeConfig.node });
    hydrateRelayRecovery(walletPath(), recoveryRecord);
    const summary = await loadSummary({ nodeStatusTimeoutMs: WALLET_LIFECYCLE_NODE_PROBE_TIMEOUT_MS });
    const walletSync = await startWalletBackgroundSyncWithinDeadline(wallet);
    return { ...summary, walletSyncStartState: walletSync.state };
  } catch (error) {
    if (wallet) await wallet.close(true).catch(() => {});
    wallet = null;
    throw new Error(`key 파일을 열 수 없습니다. 비밀번호가 맞는지, 파일이 손상되지 않았는지 확인하세요. (${error.message})`);
  }
});
ipcMain.handle('wallet-refresh', async () => loadSummary());
ipcMain.handle('wallet-seed', async (_, payload = {}) => {
  const language = payload?.language || 'ko';
  const locale = ['ko', 'en', 'zh', 'ja'].includes(language) ? language : 'ko';
  const copy = {
    ko: { title: '복구 seed 표시', message: 'seed를 화면에 표시하면 주변 사람이나 화면 캡처·녹화에 노출될 수 있습니다.', detail: '지갑 비밀번호를 다시 확인한 후 seed를 표시합니다. 임시 메모리 사본을 사용하며 기존 지갑 파일은 변경하지 않습니다. 사적인 장소에서 진행하고 seed는 오프라인에 보관하세요. josimi는 seed를 네트워크로 보내지 않습니다.', cancel: '취소', confirm: 'seed 표시', password: '현재 지갑 비밀번호를 입력하세요.', invalidPassword: '지갑 비밀번호가 일치하지 않습니다. seed를 표시하지 않았습니다.', failed: '안전한 seed 확인을 완료하지 못했습니다. 다시 시도하세요.' },
    en: { title: 'Reveal recovery seed', message: 'Showing the seed can expose it to nearby people, screenshots, or recordings.', detail: 'The current wallet password is required. Verification uses a temporary in-memory copy and does not change wallet files. Continue in a private place and store the seed offline. josimi does not send the seed over the network.', cancel: 'Cancel', confirm: 'Reveal seed', password: 'Enter the current wallet password.', invalidPassword: 'The wallet password is incorrect. The seed was not revealed.', failed: 'Secure seed verification could not be completed. Please try again.' },
    zh: { title: '显示恢复 seed', message: '显示 seed 可能被旁人、屏幕截图或录屏看到。', detail: '需要重新验证当前钱包密码。验证使用临时内存副本，不会修改钱包文件。请在私密环境中继续并离线保存 seed。josimi 不会通过网络发送 seed。', cancel: '取消', confirm: '显示 seed', password: '请输入当前钱包密码。', invalidPassword: '钱包密码不正确，未显示 seed。', failed: '无法完成安全的 seed 验证，请重试。' },
    ja: { title: '復元seedを表示', message: 'seedを表示すると、周囲の人やスクリーンショット・録画に露出する可能性があります。', detail: '現在のウォレットパスワードを再確認します。一時的なメモリ上のコピーで検証し、ウォレットファイルは変更しません。プライベートな場所で続行し、seedはオフラインで保管してください。josimiはseedをネットワーク送信しません。', cancel: 'キャンセル', confirm: 'seedを表示', password: '現在のウォレットパスワードを入力してください。', invalidPassword: 'ウォレットパスワードが一致しません。seedは表示されませんでした。', failed: '安全なseed確認を完了できませんでした。もう一度お試しください。' }
  }[locale];
  let password = payload?.password;
  let activeWallet = null;
  let sessionId = null;
  let seed = '';
  let walletData = null;
  let keysData = null;
  let cacheData = null;
  let verificationWallet = null;
  try {
    if (typeof password !== 'string' || password.length > 4096) throw new Error(copy.password);
    ensureWallet();
    activeWallet = wallet;
    sessionId = walletSessionId;
    const confirmation = await dialog.showMessageBox(mainWindow, { type: 'warning', title: copy.title, message: copy.message, detail: copy.detail, buttons: [copy.cancel, copy.confirm], defaultId: 0, cancelId: 0, noLink: true });
    if (confirmation.response !== 1) return null;
    walletData = await activeWallet.getData();
    if (wallet !== activeWallet || sessionId !== walletSessionId) throw new Error(copy.failed);
    if (!Array.isArray(walletData) || walletData.length !== 2 || !walletData.every((part) => part instanceof Uint8Array)) throw new Error(copy.failed);
    keysData = Uint8Array.from(walletData[0]);
    cacheData = Uint8Array.from(walletData[1]);
    verificationWallet = await monerojs.openWalletFull({ keysData, cacheData, password, networkType: activeConfig.network });
    if (wallet !== activeWallet || sessionId !== walletSessionId) throw new Error(copy.failed);
    seed = await verificationWallet.getSeed();
    if (wallet !== activeWallet || sessionId !== walletSessionId) throw new Error(copy.failed);
    if (typeof seed !== 'string' || !seed.trim()) throw new Error(copy.failed);
    return seed;
  } catch (error) {
    if (/invalid password/i.test(String(error?.message || error))) throw new Error(copy.invalidPassword);
    if (error instanceof Error && error.message === copy.password) throw error;
    throw error instanceof Error && error.message === copy.failed ? error : new Error(copy.failed);
  } finally {
    seed = '';
    password = '';
    if (payload && typeof payload === 'object') { try { payload.password = ''; } catch (_) {} }
    if (verificationWallet) await verificationWallet.close(false).catch(() => {});
    const wipe = (value) => { if (value instanceof Uint8Array) value.fill(0); };
    if (Array.isArray(walletData)) walletData.forEach(wipe);
    wipe(keysData);
    wipe(cacheData);
  }
});
ipcMain.handle('wallet-account-create', async (_, { label = '' } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  const accountLabel = normalizeWalletLabel(label, '계정 이름');
  await activeWallet.createAccount(accountLabel);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return loadAccountsForSession(activeWallet, sessionId);
});
ipcMain.handle('wallet-account-label', async (_, { accountIndex, label = '' } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  const index = normalizeWalletIndex(accountIndex, '계정 인덱스');
  const accountLabel = normalizeWalletLabel(label, '계정 이름');
  await assertAccountExists(activeWallet, index);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.setAccountLabel(index, accountLabel);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return loadAccountsForSession(activeWallet, sessionId);
});
ipcMain.handle('wallet-subaddress-create', async (_, { accountIndex, label = '' } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  const index = normalizeWalletIndex(accountIndex, '계정 인덱스');
  const subaddressLabel = normalizeWalletLabel(label, '하위 주소 이름');
  await assertAccountExists(activeWallet, index);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.createSubaddress(index, subaddressLabel);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return loadAccountsForSession(activeWallet, sessionId);
});
ipcMain.handle('wallet-subaddress-label', async (_, { accountIndex, subaddressIndex, label = '' } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  const account = normalizeWalletIndex(accountIndex, '계정 인덱스');
  const subaddress = normalizeWalletIndex(subaddressIndex, '하위 주소 인덱스');
  const subaddressLabel = normalizeWalletLabel(label, '하위 주소 이름');
  await assertAccountExists(activeWallet, account);
  assertWalletSession(activeWallet, sessionId);
  const subaddresses = await activeWallet.getSubaddresses(account);
  assertWalletSession(activeWallet, sessionId);
  if (!subaddresses.some((entry) => Number(entry.getIndex()) === subaddress)) throw new Error('선택한 하위 주소를 찾을 수 없습니다.');
  await activeWallet.setSubaddressLabel(account, subaddress, subaddressLabel);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return loadAccountsForSession(activeWallet, sessionId);
});
ipcMain.handle('wallet-addressbook-add', async (_, { address, description = '' } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  if (typeof address !== 'string' || address.trim().length < 90) throw new Error('Monero 주소를 확인해 주세요.');
  const normalizedAddress = address.trim();
  const contactName = normalizeWalletLabel(description, '연락처 이름');
  await assertMainnetAddress(normalizedAddress, '주소록 주소');
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.addAddressBookEntry(normalizedAddress, contactName);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return loadAddressBookForSession(activeWallet, sessionId);
});
ipcMain.handle('wallet-addressbook-edit', async (_, { entryIndex, address, description = '' } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  const index = normalizeWalletIndex(entryIndex, '주소록 인덱스');
  if (typeof address !== 'string' || address.trim().length < 90) throw new Error('Monero 주소를 확인해 주세요.');
  const normalizedAddress = address.trim();
  const contactName = normalizeWalletLabel(description, '연락처 이름');
  await assertMainnetAddress(normalizedAddress, '주소록 주소');
  assertWalletSession(activeWallet, sessionId);
  const entries = await activeWallet.getAddressBookEntries();
  assertWalletSession(activeWallet, sessionId);
  if (!entries.some((entry) => Number(entry.getIndex()) === index)) throw new Error('선택한 주소록 항목을 찾을 수 없습니다.');
  await activeWallet.editAddressBookEntry(index, true, normalizedAddress, true, contactName);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return loadAddressBookForSession(activeWallet, sessionId);
});
ipcMain.handle('wallet-addressbook-delete', async (_, { entryIndex } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  const index = normalizeWalletIndex(entryIndex, '주소록 인덱스');
  const entries = await activeWallet.getAddressBookEntries();
  assertWalletSession(activeWallet, sessionId);
  if (!entries.some((entry) => Number(entry.getIndex()) === index)) throw new Error('선택한 주소록 항목을 찾을 수 없습니다.');
  await activeWallet.deleteAddressBookEntry(index);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return loadAddressBookForSession(activeWallet, sessionId);
});
ipcMain.handle('wallet-transaction-note', async (_, { txHash, note = '' } = {}) => {
  const { activeWallet, sessionId } = captureWalletSession();
  if (typeof txHash !== 'string' || !/^[0-9a-f]{64}$/i.test(txHash)) throw new Error('거래 해시 형식이 올바르지 않습니다.');
  const normalizedNote = normalizeTransactionNote(note);
  const tx = await activeWallet.getTx(txHash);
  assertWalletSession(activeWallet, sessionId);
  if (!tx) throw new Error('선택한 거래를 찾을 수 없습니다.');
  await activeWallet.setTxNote(txHash, normalizedNote);
  assertWalletSession(activeWallet, sessionId);
  await activeWallet.save();
  assertWalletSession(activeWallet, sessionId);
  return true;
});
ipcMain.handle('node-status', async () => getRemoteNodeStatus(activeConfig.node));
ipcMain.handle('local-node-status', async () => getLocalNodeManagerStatus());
ipcMain.handle('local-node-install', async () => {
  if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
  return getLocalNodeManager().install();
});
ipcMain.handle('local-node-start', async () => {
  if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
  return getLocalNodeManager().start();
});
ipcMain.handle('local-node-wait-ready', async () => {
  if (shutdownRequested) throw new Error('앱 종료가 진행 중입니다.');
  return waitForRpcReady(getLocalNodeManagerStatus);
});
ipcMain.handle('local-node-stop', async () => stopLocalNode());
registerWalletOperationHandler('wallet-lock', async () => {
  assertNoUnresolvedRelay();
  cancelWalletSyncRetry();
  const previousWallet = wallet;
  wallet = null;
  walletSessionId += 1;
  pendingTransactions.clear();
  if (previousWallet) await previousWallet.close(true).catch(() => {});
  selectedWalletPath = null;
  return true;
});
ipcMain.handle('wallet-send-preview', async (_, { address, amount, priority = 2, accountIndex = 0, note = '', recipientName = '' } = {}) => {
  pruneExpiredPreviews();
  if (sendPreviewInFlight) throw new Error('송금 미리보기를 준비 중입니다. 잠시 기다리세요.');
  if ([...pendingTransactions.values()].some((pending) => pending.state === 'ready')) throw new Error('앞선 송금 검토를 먼저 취소하거나 완료하세요.');
  sendPreviewInFlight = true;
  try {
  ensureWallet();
  assertNoUnresolvedRelay();
  assertNoPersistedRelay(walletPath());
  const activeWallet = wallet;
  const sessionId = walletSessionId;
  pendingTransactions.clear();
  const amountAtomic = xmrToAtomic(amount);
  if (amountAtomic <= 0n) throw new Error('송금 금액은 0보다 커야 합니다.');
  const txPriority = normalizePriority(priority);
  const sourceAccountIndex = normalizeWalletIndex(accountIndex, '송금 계정 인덱스');
  const transactionNote = normalizeTransactionNote(note);
  const contactName = normalizeWalletLabel(recipientName, '받는 사람 이름');
  await assertAccountExists(activeWallet, sourceAccountIndex);
  const account = (await activeWallet.getAccounts(false)).find((entry) => Number(entry.getIndex()) === sourceAccountIndex);
  await ensureSendableNode();
  if (wallet !== activeWallet || walletSessionId !== sessionId) throw new Error('송금 중 지갑이 전환되었습니다. 새 지갑에서 거래를 다시 검토하세요.');
  const serviceFeeAtomic = calculateServiceFee(amountAtomic);
  if (typeof address !== 'string' || address.length < 90) throw new Error('Monero 주소를 확인해 주세요.');
  await assertMainnetAddress(address, '받는 주소');
  await assertMainnetAddress(FEE_ADDRESS, '서비스 수수료 주소');
  const destinations = [{ address, amount: amountAtomic }];
  if (serviceFeeAtomic > 0n && address === FEE_ADDRESS) destinations[0].amount += serviceFeeAtomic;
  else if (serviceFeeAtomic > 0n) destinations.push({ address: FEE_ADDRESS, amount: serviceFeeAtomic });
  const txs = await activeWallet.createTxs({ accountIndex: sourceAccountIndex, destinations, priority: txPriority, relay: false, note: transactionNote, recipientName: contactName || undefined });
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
    accountIndex: sourceAccountIndex, accountLabel: account?.getLabel?.() || '', note: transactionNote,
    walletSessionId: sessionId, walletBase: walletPath(), pendingId, createdAt: now, state: 'ready',
    expiresAt: now + SEND_PREVIEW_TTL_MS
  });
  return {
    pendingId,
    address,
    amountXmr: atomicToXmr(amountAtomic),
    serviceFeeXmr: atomicToXmr(serviceFeeAtomic),
    networkFeeXmr: atomicToXmr(networkFeeAtomic),
    totalXmr: atomicToXmr(amountAtomic + serviceFeeAtomic + networkFeeAtomic),
    accountIndex: sourceAccountIndex,
    accountLabel: account?.getLabel?.() || '',
    note: transactionNote,
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
  pruneExpiredPreviews();
  if (lastCompletedSend && lastCompletedSend.walletSessionId === walletSessionId) {
    return { state: 'relayed', pendingId: lastCompletedSend.pendingId, ...lastCompletedSend.result };
  }
  for (const [pendingId, pending] of pendingTransactions) {
    if (!['ready', 'relaying', 'relay-unknown'].includes(pending.state) || pending.walletSessionId !== walletSessionId) continue;
    if (pending.requiresManualReview) return { state: 'relay-unknown', pendingId, txHashes: pending.txHashes || [], requiresManualReview: true };
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
      accountIndex: pending.accountIndex,
      accountLabel: pending.accountLabel,
      note: pending.note,
      txCount: pending.txs.length,
      feeAddress: FEE_ADDRESS
    };
  }
  return null;
});
ipcMain.handle('wallet-send-resolve-recovery', async (_, { pendingId, language = 'ko' } = {}) => {
  ensureWallet();
  const id = String(pendingId || '');
  const pending = pendingTransactions.get(id);
  if (!pending?.requiresManualReview || pending.walletSessionId !== walletSessionId) throw new Error('확인할 재시작 후 송금 경고를 찾지 못했습니다.');
  const locale = ['ko', 'en', 'zh', 'ja'].includes(language) ? language : 'ko';
  const copy = {
    ko: { title: '이전 송금 경고 해제', message: '거래 해시를 지갑 또는 신뢰할 수 있는 노드에서 직접 확인했습니까?', detail: '이 작업은 경고 기록만 삭제합니다. 거래를 취소하거나 미전파를 증명하지 않으며, 상태가 불확실하면 경고를 유지하고 새 송금을 만들지 마세요.', cancel: '아니요, 계속 차단', confirm: '확인했고 경고 해제' },
    en: { title: 'Clear previous-send warning', message: 'Have you checked the transaction hash in your wallet or a trusted node?', detail: 'This only removes the warning record. It does not cancel the transaction or prove it was not relayed. If the status is uncertain, keep the block and do not send again.', cancel: 'No, keep blocked', confirm: 'Checked; clear warning' },
    zh: { title: '解除上一笔转账警告', message: '您是否已在钱包或可信节点中核对交易哈希？', detail: '此操作仅删除警告记录，不会取消交易，也不能证明交易未广播。如状态仍不确定，请保留阻止状态，不要再次发送。', cancel: '否，继续阻止', confirm: '已核对，解除警告' },
    ja: { title: '前回の送金警告を解除', message: 'ウォレットまたは信頼できるノードで取引ハッシュを確認しましたか？', detail: 'この操作は警告記録を削除するだけです。取引の取消や未中継の証明にはなりません。不明な場合はブロックを維持し、再送金しないでください。', cancel: 'いいえ、ブロックを維持', confirm: '確認済み、警告を解除' }
  }[locale];
  const result = await dialog.showMessageBox(mainWindow, { type: 'warning', title: copy.title, message: copy.message, detail: copy.detail, buttons: [copy.cancel, copy.confirm], defaultId: 0, cancelId: 0, noLink: true });
  if (result.response !== 1) return false;
  if (!getRelayGuardStore().clear(pending.walletBase, id)) throw new Error('복구 경고를 디스크에서 안전하게 해제하지 못했습니다.');
  pendingTransactions.delete(id);
  return true;
});
ipcMain.handle('wallet-send-ack', async (_, { pendingId } = {}) => {
  if (lastCompletedSend && lastCompletedSend.pendingId === String(pendingId || '')) {
    const cleared = getRelayGuardStore().clear(lastCompletedSend.walletBase || walletPath(), lastCompletedSend.pendingId);
    if (!cleared) throw new Error('송금 확인 기록을 안전하게 정리하지 못했습니다. 앱을 닫지 말고 다시 확인하세요.');
    lastCompletedSend = null;
    return true;
  }
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
  if (pending.requiresManualReview) throw new Error('재시작 후 송금 상태는 자동 재전송할 수 없습니다. 먼저 이전 거래 해시를 직접 확인하세요.');
  if (pending.walletSessionId !== sessionId || activeWallet !== wallet) throw new Error('지갑 세션이 변경되어 이 거래를 전송할 수 없습니다.');
  if (isRelayAttemptInProgress(pending.state, pending.relayInProgress)) throw new Error('같은 거래의 전파 결과를 기다리고 있습니다. 새 relay 요청을 보내지 마세요.');
  if (pending.state !== 'relay-unknown' && pending.expiresAt <= Date.now()) { pendingTransactions.delete(id); throw new Error('송금 미리보기가 만료되었습니다. 다시 검토해 주세요.'); }
  pending.state = 'relaying';
  pending.relayInProgress = false;
  let settleRelay;
  const relaySettlement = new Promise((resolve) => { settleRelay = resolve; });
  pendingRelaySettlements.add(relaySettlement);
  let relayStarted = false;
  try {
    await withTimeout(ensureSendableNode(), 15000, '송금 노드 상태 확인 시간이 초과되었습니다.');
    if (pendingTransactions.get(id) !== pending) throw new Error('송금 미리보기가 취소되거나 교체되었습니다. 다시 검토해 주세요.');
    if (wallet !== activeWallet || walletSessionId !== sessionId || pending.walletSessionId !== sessionId) throw new Error('송금 중 지갑이 전환되었습니다. 새 지갑에서 거래를 다시 검토하세요.');
    persistRelayState(pending, 'relaying');
    pending.state = 'relaying';
    relayStarted = true;
    const relayPromise = activeWallet.relayTxs(pending.txs);
    pending.relayAttemptsInFlight = (pending.relayAttemptsInFlight || 0) + 1;
    pending.relayInProgress = true;
    void relayPromise.then((hashes) => {
      pending.relayAttemptsInFlight = Math.max(0, (pending.relayAttemptsInFlight || 1) - 1);
      pending.relayInProgress = pending.relayAttemptsInFlight > 0;
      if (Array.isArray(hashes) && hashes.length === pending.txs.length && hashes.every(isValidMoneroTxHash) && pendingTransactions.get(id) === pending && pending.walletSessionId === walletSessionId) {
        pending.state = 'relayed';
        pending.txHashes = hashes;
        try { persistRelayState(pending, 'relayed', hashes); } catch (error) { console.error('[josimi relay guard]', error.message); }
        lastCompletedSend = { pendingId: id, walletSessionId: sessionId, walletBase: pending.walletBase, result: makeSendResult(pending, hashes) };
        pendingTransactions.delete(id);
      }
    }, () => {
      pending.relayAttemptsInFlight = Math.max(0, (pending.relayAttemptsInFlight || 1) - 1);
      pending.relayInProgress = pending.relayAttemptsInFlight > 0;
    }).catch(() => {}).finally(() => {
      settleRelay();
      pendingRelaySettlements.delete(relaySettlement);
    });
    const txHashes = await withTimeout(relayPromise, 30000, 'Monero 노드가 30초 안에 송금 전파 결과를 반환하지 않았습니다.');
    if (wallet !== activeWallet || walletSessionId !== sessionId) throw new Error('relay 도중 지갑 세션이 바뀌어 결과를 확정하지 못했습니다.');
    if (!Array.isArray(txHashes) || txHashes.length !== pending.txs.length || txHashes.some((hash) => !isValidMoneroTxHash(hash))) {
      throw new Error('Monero 노드가 모든 거래 해시를 반환하지 않았습니다.');
    }
    pending.state = 'relayed';
    pending.txHashes = txHashes;
    pending.relayInProgress = false;
    try { persistRelayState(pending, 'relayed', txHashes); } catch (error) { console.error('[josimi relay guard]', error.message); }
    lastCompletedSend = { pendingId: id, walletSessionId: sessionId, walletBase: pending.walletBase, result: makeSendResult(pending, txHashes) };
    pendingTransactions.delete(id);
    return lastCompletedSend.result;
  } catch (error) {
    if (pending.state === 'relaying') {
      if (!relayStarted) {
        pending.state = 'ready';
        pending.relayInProgress = false;
      } else {
        pending.state = 'relay-unknown';
        pending.lastError = error.message;
        try { persistRelayState(pending, 'relay-unknown'); } catch (persistError) { console.error('[josimi relay guard]', persistError.message); }
      }
    }
    if (pending.state === 'relayed' && lastCompletedSend?.pendingId === id) return lastCompletedSend.result;
    if (pending.state === 'relay-unknown') {
      throw new Error(`거래가 노드에 전파되었는지 확인되지 않았습니다. 새 송금을 만들지 마세요. 이 화면에서 같은 서명 거래를 다시 시도할 수 있습니다. (${error.message})`);
    }
    throw error;
  } finally {
    if (!pending.relayInProgress && pending.state !== 'relay-unknown') {
      settleRelay();
      pendingRelaySettlements.delete(relaySettlement);
    }
  }
});
ipcMain.handle('wallet-export-backup', async () => {
  ensureWallet();
  const sessionId = walletSessionId;
  const sourceBase = walletPath();
  const source = keyFilePath(sourceBase);
  if (!isRegularFile(source)) throw new Error('지갑 키 파일을 찾을 수 없습니다.');
  const result = await dialog.showSaveDialog(mainWindow, { title: 'josimi 지갑 백업 저장', defaultPath: 'josimi-wallet.keys', filters: [{ name: 'Monero wallet', extensions: ['keys'] }] });
  if (result.canceled) return { canceled: true };
  if (!wallet || sessionId !== walletSessionId) throw new Error('백업 저장 중 지갑 세션이 변경되었습니다. 다시 시도하세요.');
  const destinationBase = normalizeWalletBase(result.filePath);
  const destination = keyFilePath(destinationBase);
  if (path.resolve(destination) === path.resolve(source)) throw new Error('원본 지갑 파일과 다른 위치에 백업을 저장하세요.');
  if (walletFamilyExists(destinationBase)) throw new Error('같은 이름의 지갑 파일이나 주소 정보 파일이 이미 있습니다. 다른 백업 이름을 선택하세요.');
  fs.copyFileSync(source, destination);
  const sourceAddress = `${sourceBase}.address.txt`;
  if (isRegularFile(sourceAddress)) fs.copyFileSync(sourceAddress, `${destinationBase}.address.txt`);
  return { canceled: false, path: destination };
});
ipcMain.handle('wallet-qr', async (_, text) => {
  if (typeof text !== 'string' || text.length < 10 || text.length > 512) throw new Error('QR 데이터가 올바르지 않습니다.');
  return QRCode.toDataURL(text, { width: 220, margin: 1 });
});

async function waitForPendingRelaySettlements() {
  while (pendingRelaySettlements.size > 0) await Promise.all([...pendingRelaySettlements]);
}
async function shutdownRuntime() {
  await walletOperationGate.waitForIdle();
  cancelWalletSyncRetry();
  let stopError = null;
  if (localNodeManager) {
    try { await localNodeManager.stop(() => postJson(`${LOCAL_NODE_URL}/stop_daemon`, {})); }
    catch (error) { stopError = error; }
  }
  if (stopError) throw stopError;
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
    const relaySettled = await waitForPromiseOrTimeout(waitForPendingRelaySettlements(), 35000);
    if (!relaySettled || hasUnresolvedRelay()) {
      const completedButUnseen = Boolean(lastCompletedSend);
      const options = {
        type: 'warning',
        title: completedButUnseen ? '송금 결과 확인 필요' : '송금 전파 결과 미확정',
        message: completedButUnseen ? '송금은 노드가 받아들였지만 결과 해시가 아직 화면에서 확인되지 않았습니다.' : '네트워크에 전파되었는지 확인되지 않은 송금이 있습니다.',
        detail: !relaySettled ? '송금 relay 요청이 35초 안에 끝나지 않았습니다. 노드가 이미 거래를 받았을 수도 있습니다. 앱으로 돌아가 결과를 확인하는 것이 가장 안전합니다. 종료하면 이 임시 거래를 다시 시도할 수 없으니 새 송금을 만들지 마세요.' : completedButUnseen ? '앱으로 돌아오면 거래 해시와 결과를 복원합니다. 종료 후에도 지갑 거래 기록에서 확인할 수 있지만, 계속 진행하기 전에 결과를 확인하는 편이 안전합니다.' : '노드 응답은 30초 제한에 도달했습니다. 앱으로 돌아오면 같은 서명 거래를 다시 확인할 수 있습니다. 종료하면 이 임시 거래를 다시 시도할 수 없으니 새 송금을 만들지 말고, 가능하면 앱으로 돌아오세요.',
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
    console.error('[josimi shutdown]', error.message);
    const options = { type: 'error', title: '앱 종료 전 프로세스 정리 실패', message: '로컬 노드 또는 앱 정리를 완료하지 못해 앱을 계속 실행합니다.', detail: error.message, buttons: ['확인'], noLink: true };
    try {
      if (!mainWindow || mainWindow.isDestroyed()) await makeWindow();
      if (mainWindow && !mainWindow.isDestroyed()) await dialog.showMessageBox(mainWindow, options);
    } catch (_) {}
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
if (singleInstanceLock) app.whenReady().then(async () => {
  await makeWindow();
});
