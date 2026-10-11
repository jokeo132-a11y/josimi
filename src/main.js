const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const monerojs = require('monero-ts');

const FEE_ADDRESS = '42oyVMt9WTyVBNSY81ArA4NotCt7hKxxXQMk32e1tS6oTaxVZv2Y72E83JLV3xBF2e28uF3YiuAYNizNZTACBq1JHfzwUHu';
const SERVICE_FEE_RATE = 0.0025;
const SERVICE_FEE_CAP_ATOMIC = 50000000000n; // 0.05 XMR
const ATOMIC_PER_XMR = 1000000000000n;
const NETWORK = 'mainnet';
const DEFAULT_NODES = [
  // HTTPS is required for the default public endpoint; users can enter their own node.
  'https://node.monerodevs.org:18089'
];

let mainWindow;
let wallet = null;
let sessionPassword = null;
let activeConfig = { network: NETWORK, node: DEFAULT_NODES[0] };

function walletDir() {
  const dir = path.join(app.getPath('userData'), 'wallets');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
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
  for (const file of walletFiles(tempPath)) fs.renameSync(path.join(walletDir(), file), path.join(walletDir(), file.replace(path.basename(tempPath), 'monejo-wallet')));
  return archived;
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
function calculateServiceFee(amountAtomic) {
  const computed = (amountAtomic * 25n) / 10000n;
  return computed > SERVICE_FEE_CAP_ATOMIC ? SERVICE_FEE_CAP_ATOMIC : computed;
}
async function assertMainnetAddress(address, label) {
  if (!(await monerojs.MoneroUtils.isValidAddress(address, 'mainnet'))) throw new Error(`${label}가 유효한 Monero mainnet 주소가 아닙니다.`);
}
function ensureWallet() { if (!wallet) throw new Error('먼저 지갑을 열거나 생성해 주세요.'); }
function safeTx(tx) {
  return { hash: tx.getHash?.(), fee: tx.getFee?.()?.toString?.() || '0', amount: tx.getAmount?.()?.toString?.() || '0', height: tx.getHeight?.(), isConfirmed: tx.isConfirmed?.(), isLocked: tx.isLocked?.(), timestamp: tx.getTimestamp?.() };
}
async function loadSummary() {
  ensureWallet();
  const address = await wallet.getPrimaryAddress();
  const balance = await wallet.getBalance(0);
  let txs = [];
  try { txs = await wallet.getTxs({ accountIndex: 0 }); } catch (_) {}
  return { address, balance: balance.toString(), balanceXmr: atomicToXmr(balance), txs: txs.slice(-30).reverse().map(safeTx), network: activeConfig.network, node: activeConfig.node };
}
async function makeWindow() {
  mainWindow = new BrowserWindow({ width: 1180, height: 820, minWidth: 980, minHeight: 680, backgroundColor: '#0b0b0b', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  await mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('app-config', () => ({ feeAddress: FEE_ADDRESS, feeRate: SERVICE_FEE_RATE, feeCapXmr: '0.05', network: activeConfig.network, defaultNodes: DEFAULT_NODES }));
ipcMain.handle('wallet-create', async (_, { password, node, network = NETWORK }) => {
  if (!password || password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
  if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
  activeConfig = { network, node: node || DEFAULT_NODES[0] };
  const creationPath = tempWalletPath('monejo-create');
  let created;
  try {
    created = await monerojs.createWalletFull({ path: creationPath, password, networkType: network, serverUri: activeConfig.node });
    const seed = await created.getSeed();
    await created.close(true);
    promoteWallet(creationPath);
    wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, serverUri: activeConfig.node });
    sessionPassword = password;
    const summary = await loadSummary();
    return { ...summary, seed, warning: '이 seed는 누구에게도 보여주지 말고 오프라인으로 백업하세요.' };
  } catch (error) {
    if (created) await created.close(true).catch(() => {});
    removeWalletFiles(creationPath);
    wallet = null;
    throw new Error(`지갑 생성에 실패했습니다. 노드 주소를 확인하세요. (${error.message})`);
  }
});
ipcMain.handle('wallet-restore', async (_, { password, seed, node, network = NETWORK }) => {
  if (!password || password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
  const normalizedSeed = String(seed || '').trim().replace(/\s+/g, ' ');
  const wordCount = normalizedSeed ? normalizedSeed.split(' ').length : 0;
  if (![12, 13, 24, 25].includes(wordCount)) throw new Error('Monero seed 단어 수를 확인해 주세요. 표준 seed는 12/13/24/25단어입니다.');
  if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
  activeConfig = { network, node: node || DEFAULT_NODES[0] };
  const recoveryPath = tempWalletPath('monejo-recovery');
  let recovered;
  try {
    recovered = await monerojs.createWalletFull({ path: recoveryPath, password, networkType: network, seed: normalizedSeed, serverUri: activeConfig.node });
    await recovered.close(true);
    promoteWallet(recoveryPath);
  } catch (error) {
    if (recovered) await recovered.close(true).catch(() => {});
    removeWalletFiles(recoveryPath);
    throw new Error(`seed 복구에 실패했습니다. seed와 네트워크를 다시 확인하세요. (${error.message})`);
  }
  wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, serverUri: activeConfig.node });
  sessionPassword = password;
  return { ...(await loadSummary()), restored: true, recoveryNote: '기존 지갑은 복구 전 자동 보관되었습니다.' };
});
ipcMain.handle('wallet-open', async (_, { password, node, network = NETWORK }) => {
  if (!fs.existsSync(walletPath() + '.keys')) throw new Error('저장된 monejo 지갑이 없습니다. 새로 만들거나 seed로 복구하세요.');
  if (wallet) { await wallet.close(true).catch(() => {}); wallet = null; }
  activeConfig = { network, node: node || DEFAULT_NODES[0] };
  wallet = await monerojs.openWalletFull({ path: walletPath(), password, networkType: network, serverUri: activeConfig.node });
  sessionPassword = password;
  return loadSummary();
});
ipcMain.handle('wallet-refresh', async () => loadSummary());
ipcMain.handle('wallet-lock', async () => { if (wallet) await wallet.close(true).catch(() => {}); wallet = null; sessionPassword = null; return true; });
ipcMain.handle('wallet-send-preview', async (_, { address, amount }) => {
  ensureWallet();
  const amountAtomic = xmrToAtomic(amount);
  const serviceFeeAtomic = calculateServiceFee(amountAtomic);
  if (!address || address.length < 90) throw new Error('Monero 주소를 확인해 주세요.');
  await assertMainnetAddress(address, '받는 주소');
  await assertMainnetAddress(FEE_ADDRESS, '서비스 수수료 주소');
  return { address, amountXmr: amount, amountAtomic: amountAtomic.toString(), serviceFeeXmr: atomicToXmr(serviceFeeAtomic), serviceFeeAtomic: serviceFeeAtomic.toString(), feeRate: SERVICE_FEE_RATE, feeCapXmr: '0.05', feeAddress: FEE_ADDRESS, totalBeforeNetworkFeeXmr: atomicToXmr(amountAtomic + serviceFeeAtomic) };
});
ipcMain.handle('wallet-send', async (_, { address, amount, priority = 2 }) => {
  ensureWallet();
  const amountAtomic = xmrToAtomic(amount);
  const serviceFeeAtomic = calculateServiceFee(amountAtomic);
  await assertMainnetAddress(address, '받는 주소');
  await assertMainnetAddress(FEE_ADDRESS, '서비스 수수료 주소');
  const destinations = [{ address, amount: amountAtomic.toString() }, { address: FEE_ADDRESS, amount: serviceFeeAtomic.toString() }];
  const txs = await wallet.createTxs({ accountIndex: 0, destinations, priority: Number(priority), relay: true });
  return { txs: txs.map(safeTx), serviceFeeXmr: atomicToXmr(serviceFeeAtomic) };
});
ipcMain.handle('wallet-export-backup', async () => {
  ensureWallet();
  const result = await dialog.showSaveDialog(mainWindow, { title: 'monejo 지갑 백업 저장', defaultPath: 'monejo-wallet.keys', filters: [{ name: 'Monero wallet', extensions: ['keys'] }] });
  if (result.canceled) return { canceled: true };
  fs.copyFileSync(walletPath() + '.keys', result.filePath);
  return { canceled: false, path: result.filePath };
});

app.whenReady().then(makeWindow);
app.on('window-all-closed', async () => { if (wallet) await wallet.close(true).catch(() => {}); if (process.platform !== 'darwin') app.quit(); });
