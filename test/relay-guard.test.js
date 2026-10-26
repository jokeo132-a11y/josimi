'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { RelayGuardStore, walletKey } = require('../src/relay-guard');

function makeRecord(overrides = {}) {
  return { pendingId: 'a'.repeat(48), state: 'relay-unknown', txHashes: ['b'.repeat(64)], createdAt: Date.now(), ...overrides };
}

test('relay recovery records persist per wallet and clear only for a matching pending id', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-relay-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new RelayGuardStore(path.join(directory, 'relay.json'));
  const walletA = path.join(directory, 'wallet-a');
  const walletB = path.join(directory, 'wallet-b');
  store.save(walletA, makeRecord());
  store.save(walletB, makeRecord({ pendingId: 'c'.repeat(48), txHashes: [] }));
  assert.equal(store.get(walletA).pendingId, 'a'.repeat(48));
  assert.equal(store.get(walletB).pendingId, 'c'.repeat(48));
  assert.equal(Object.hasOwn(store.get(walletA), 'address'), false);
  assert.equal(Object.hasOwn(store.get(walletA), 'amountXmr'), false);
  assert.equal(store.clear(walletA, 'd'.repeat(48)), false);
  assert.equal(store.get(walletA).pendingId, 'a'.repeat(48));
  assert.equal(store.clear(walletA, 'a'.repeat(48)), true);
  assert.equal(store.get(walletA), null);
  assert.equal(store.get(walletB).pendingId, 'c'.repeat(48));
});

test('wallet path is represented only by a one-way hash in persisted records', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-relay-path-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const wallet = path.join(directory, 'private-user-wallet');
  const filePath = path.join(directory, 'relay.json');
  const store = new RelayGuardStore(filePath);
  store.save(wallet, makeRecord());
  const saved = fs.readFileSync(filePath, 'utf8');
  assert.equal(saved.includes(wallet), false);
  assert.equal(saved.includes(walletKey(wallet)), true);
});

test('wallet path identity preserves case on case-sensitive platforms and folds it on Windows', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-relay-case-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const upper = path.join(directory, 'Wallet');
  const lower = path.join(directory, 'wallet');
  const store = new RelayGuardStore(path.join(directory, 'relay.json'));
  if (process.platform === 'win32') {
    assert.equal(walletKey(upper), walletKey(lower));
    store.save(upper, makeRecord());
    assert.equal(store.get(lower).pendingId, 'a'.repeat(48));
  } else {
    assert.notEqual(walletKey(upper), walletKey(lower));
    store.save(upper, makeRecord());
    store.save(lower, makeRecord({ pendingId: 'c'.repeat(48) }));
    assert.equal(store.get(upper).pendingId, 'a'.repeat(48));
    assert.equal(store.get(lower).pendingId, 'c'.repeat(48));
  }
});

test('corrupt relay recovery data fails closed instead of silently allowing new sends', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-relay-corrupt-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'relay.json');
  fs.writeFileSync(filePath, '{not json', { mode: 0o600 });
  const store = new RelayGuardStore(filePath);
  assert.throws(() => store.get(path.join(directory, 'wallet')), /new sends are blocked/);
});

test('invalid or modified transaction hashes cannot be persisted as a relay record', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-relay-invalid-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new RelayGuardStore(path.join(directory, 'relay.json'));
  assert.throws(() => store.save(path.join(directory, 'wallet'), makeRecord({ txHashes: ['short'] })), /Invalid relay recovery record/);
});

test('relay recovery schema allowlist rejects sensitive extension fields on write and read', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-relay-schema-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'relay.json');
  const wallet = path.join(directory, 'wallet');
  const store = new RelayGuardStore(filePath);
  assert.throws(() => store.save(wallet, makeRecord({ address: 'private-address', amountXmr: '123' })), /unsupported fields/);
  store.save(wallet, makeRecord());
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  content.records[walletKey(wallet)].recipient = 'private-address';
  fs.writeFileSync(filePath, JSON.stringify(content), { mode: 0o600 });
  assert.throws(() => store.get(wallet), /failed validation/);
});

test('relay recovery record capacity fails closed without evicting unresolved warnings', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'josimi-relay-capacity-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = new RelayGuardStore(path.join(directory, 'relay.json'));
  for (let index = 0; index < 64; index += 1) {
    store.save(path.join(directory, `wallet-${index}`), makeRecord({ pendingId: String(index).padStart(48, '0') }));
  }
  assert.throws(
    () => store.save(path.join(directory, 'wallet-overflow'), makeRecord({ pendingId: 'f'.repeat(48) })),
    /Too many unresolved relay recovery records/
  );
  assert.equal(store.get(path.join(directory, 'wallet-0')).pendingId, '0'.repeat(48));
  assert.equal(store.get(path.join(directory, 'wallet-63')).pendingId, '63'.padStart(48, '0'));
});
