'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { pathToFileURL } = require('node:url');
const Module = require('node:module');
const monero = require('monero-ts');

const root = path.join(__dirname, '..');

test('real wallet IPC creates, reopens, and restores offline without waiting for sync startup', { timeout: 60_000 }, async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-wallet-lifecycle-'));
  const documents = path.join(temp, 'Documents');
  const userData = path.join(temp, 'userData');
  fs.mkdirSync(documents, { recursive: true });
  fs.mkdirSync(userData, { recursive: true });

  const appUrl = pathToFileURL(path.join(root, 'src', 'index.html')).href;
  const handlers = new Map();
  const session = { setPermissionRequestHandler() {}, setPermissionCheckHandler() {} };
  let savePath = path.join(documents, 'first-wallet');
  let openPath = path.join(documents, 'first-wallet.keys');
  const fakeApp = new EventEmitter();
  Object.assign(fakeApp, {
    isPackaged: false,
    requestSingleInstanceLock: () => true,
    getPath: (name) => name === 'userData' ? userData : documents,
    whenReady: () => Promise.resolve(),
    quit() {},
    exit() {}
  });
  class FakeBrowserWindow extends EventEmitter {
    constructor() {
      super();
      this.webContents = {
        session,
        send() {},
        on() {},
        setWindowOpenHandler() {},
        getURL: () => appUrl
      };
      this.destroyed = false;
    }
    async loadFile(file) { this.webContents.url = pathToFileURL(file).href; }
    isDestroyed() { return this.destroyed; }
    isMinimized() { return false; }
    restore() {}
    focus() {}
  }

  const electronStub = {
    app: fakeApp,
    BrowserWindow: FakeBrowserWindow,
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    dialog: {
      showSaveDialog: async () => ({ canceled: false, filePath: savePath }),
      showOpenDialog: async () => ({ canceled: false, filePaths: [openPath] }),
      showMessageBox: async () => ({ response: 1 })
    }
  };

  const originalModuleLoad = Module._load;
  const originalOpenWalletFull = monero.openWalletFull;
  let event;
  Module._load = function (request, parent, isMain) {
    if (request === 'electron') return electronStub;
    return originalModuleLoad.call(this, request, parent, isMain);
  };
  monero.openWalletFull = async function (config) {
    const wallet = await originalOpenWalletFull.call(monero, config);
    wallet.startSyncing = () => new Promise(() => {});
    return wallet;
  };

  try {
    require(path.join(root, 'src', 'main.js'));
    await new Promise((resolve) => setTimeout(resolve, 25));
    for (const channel of ['wallet-file-choose', 'wallet-create', 'wallet-open', 'wallet-restore', 'wallet-seed', 'wallet-lock']) {
      assert.ok(handlers.has(channel), `expected ${channel} IPC handler to register`);
    }
    const frame = { url: appUrl };
    event = { senderFrame: frame, sender: { mainFrame: frame } };
    const node = 'http://127.0.0.1:1';
    const password = 'Integration-Test-' + require('node:crypto').randomBytes(16).toString('hex');

    await handlers.get('wallet-file-choose')(event, { action: 'save' });
    const created = await handlers.get('wallet-create')(event, { password, node, network: 'mainnet' });
    assert.match(created.address, /^4/);
    assert.equal(created.accounts.length, 1);
    assert.equal(created.walletSyncStartState, 'starting');
    assert.ok(fs.statSync(path.join(documents, 'first-wallet.keys')).isFile());

    const seedPayload = { password, language: 'en' };
    const seed = await handlers.get('wallet-seed')(event, seedPayload);
    assert.equal(typeof seed, 'string');
    assert.ok(seed.trim().split(/\s+/).length >= 12);
    assert.equal(seedPayload.password, '');

    await handlers.get('wallet-lock')(event);
    await handlers.get('wallet-file-choose')(event, { action: 'open' });
    const reopened = await handlers.get('wallet-open')(event, { password, node, network: 'mainnet' });
    assert.equal(reopened.address, created.address);
    assert.equal(reopened.walletSyncStartState, 'starting');

    await handlers.get('wallet-lock')(event);
    savePath = path.join(documents, 'restored-wallet');
    await handlers.get('wallet-file-choose')(event, { action: 'save' });
    const restorePayload = { password, seed, seedOffset: '', restoreHeight: 0, node, network: 'mainnet' };
    const restored = await handlers.get('wallet-restore')(event, restorePayload);
    assert.equal(restored.address, created.address);
    assert.equal(restored.restored, true);
    assert.equal(restored.walletSyncStartState, 'starting');
    assert.equal(restorePayload.password, '');
    assert.equal(restorePayload.seed, '');
    assert.ok(fs.statSync(path.join(documents, 'restored-wallet.keys')).isFile());
  } finally {
    try { if (event && handlers.has('wallet-lock')) await handlers.get('wallet-lock')(event); } catch (_) {}
    monero.openWalletFull = originalOpenWalletFull;
    Module._load = originalModuleLoad;
    try { await monero.shutdown?.(); } catch (_) {}
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
