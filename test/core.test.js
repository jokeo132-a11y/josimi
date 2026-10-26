'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  atomicToXmr,
  xmrToAtomic,
  MAX_ATOMIC,
  calculateServiceFee,
  SERVICE_FEE_CAP_ATOMIC,
  validateMiningThreads,
  p2poolPeerPort,
  isValidMoneroTxHash,
  normalizeWalletIndex,
  normalizeWalletLabel,
  normalizeTransactionNote,
  validateWalletPassword,
  isRelayAttemptInProgress,
  waitForPromiseOrTimeout,
  isMoneroKeysFile,
  isAllowedNodeRedirect,
  canAppendResponseBytes
} = require('../src/core');

test('XMR amount conversion preserves atomic-unit precision', () => {
  assert.equal(xmrToAtomic('1.000000000001'), 1000000000001n);
  assert.equal(xmrToAtomic('0.25'), 250000000000n);
  assert.equal(atomicToXmr(1000000000001n), '1.000000000001');
  assert.equal(atomicToXmr(0n), '0.0');
});

test('XMR amount parsing rejects invalid and over-precision values', () => {
  for (const value of ['', '-1', '1e-3', '1.0000000000001', '.5', '1.']) {
    assert.throws(() => xmrToAtomic(value), { message: 'XMR 금액 형식이 올바르지 않습니다.' });
  }
});

test('XMR conversion rejects negative and uint64-overflow values', () => {
  assert.equal(xmrToAtomic('18446744.073709551615'), MAX_ATOMIC);
  assert.throws(() => xmrToAtomic('18446744.073709551616'), RangeError);
  assert.throws(() => atomicToXmr(-1n), RangeError);
  assert.throws(() => atomicToXmr(MAX_ATOMIC + 1n), RangeError);
});

test('service fee is 0.25 percent and capped at 0.05 XMR', () => {
  assert.equal(calculateServiceFee(100000000000n), 250000000n);
  assert.equal(calculateServiceFee(100000000000000n), SERVICE_FEE_CAP_ATOMIC);
  assert.equal(calculateServiceFee(0n), 0n);
  assert.throws(() => calculateServiceFee(-1n), RangeError);
});

test('mining thread input accepts any positive safe integer without CPU-count or 20-step limits', () => {
  assert.equal(validateMiningThreads(1), 1);
  assert.equal(validateMiningThreads(21), 21);
  assert.equal(validateMiningThreads(4097), 4097);
  for (const value of [0, -1, 1.5, NaN, Infinity, 'threads']) assert.throws(() => validateMiningThreads(value), RangeError);
});

test('P2Pool peer listener uses the upstream port for each sidechain profile', () => {
  assert.equal(p2poolPeerPort('main'), 37889);
  assert.equal(p2poolPeerPort('mini'), 37888);
  assert.equal(p2poolPeerPort('nano'), 37890);
  for (const profile of ['', 'unknown', null]) assert.throws(() => p2poolPeerPort(profile), RangeError);
});

test('Monero transaction hashes must be exactly 64 hexadecimal characters', () => {
  assert.equal(isValidMoneroTxHash('a'.repeat(64)), true);
  assert.equal(isValidMoneroTxHash('F'.repeat(64)), true);
  for (const value of ['a'.repeat(63), 'a'.repeat(65), 'g'.repeat(64), '', null, 42]) assert.equal(isValidMoneroTxHash(value), false);
});

test('remote node redirects cannot downgrade protocol or change origin', () => {
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'https://node.example/rpc2'), true);
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'http://node.example/rpc'), false);
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'https://other.example/rpc'), false);
  assert.equal(isAllowedNodeRedirect('http://127.0.0.1:18081/json_rpc', 'http://localhost:18081/json_rpc'), false);
  assert.equal(isAllowedNodeRedirect('not a url', 'https://node.example/'), false);
});

test('node RPC response byte accounting enforces a hard size limit', () => {
  assert.equal(canAppendResponseBytes(0, 512, 1024), true);
  assert.equal(canAppendResponseBytes(512, 512, 1024), true);
  assert.equal(canAppendResponseBytes(512, 513, 1024), false);
  assert.equal(canAppendResponseBytes(-1, 1, 1024), false);
  assert.equal(canAppendResponseBytes(0, Number.MAX_SAFE_INTEGER + 1, 1024), false);
});

test('wallet indices must be non-negative safe integers', () => {
  assert.equal(normalizeWalletIndex(0), 0);
  assert.equal(normalizeWalletIndex('12', '계정 인덱스'), 12);
  for (const value of [-1, 1.5, NaN, Infinity, 'not-an-index', '', null, undefined]) assert.throws(() => normalizeWalletIndex(value));
});

test('wallet labels and transaction notes are trimmed and bounded', () => {
  assert.equal(normalizeWalletLabel('  Savings  '), 'Savings');
  assert.equal(normalizeWalletLabel(undefined), '');
  assert.equal(normalizeTransactionNote('  monthly rent  '), 'monthly rent');
  assert.throws(() => normalizeWalletLabel('x'.repeat(81)), RangeError);
  assert.throws(() => normalizeTransactionNote('x'.repeat(501)), RangeError);
  assert.throws(() => normalizeWalletLabel({}), TypeError);
});

test('new wallet passwords require 8 characters while existing wallets accept their original password', () => {
  assert.equal(validateWalletPassword('long-pass'), 'long-pass');
  assert.throws(() => validateWalletPassword('short'), /8자 이상/);
  assert.equal(validateWalletPassword('old', 0), 'old');
  assert.equal(validateWalletPassword('', 0), '');
  assert.throws(() => validateWalletPassword(null, 0), /비밀번호 형식/);
});

test('a relay retry is blocked while the previous relay attempt is still in flight', () => {
  assert.equal(isRelayAttemptInProgress('relaying', false), true);
  assert.equal(isRelayAttemptInProgress('relay-unknown', true), true);
  assert.equal(isRelayAttemptInProgress('relay-unknown', false), false);
  assert.equal(isRelayAttemptInProgress('ready', false), false);
});

test('promise waits are bounded and treat resolved or rejected work as settled', async () => {
  assert.equal(await waitForPromiseOrTimeout(Promise.resolve(), 100), true);
  assert.equal(await waitForPromiseOrTimeout(Promise.reject(new Error('expected')), 100), true);
  assert.equal(await waitForPromiseOrTimeout(new Promise(() => {}), 5), false);
  await assert.rejects(waitForPromiseOrTimeout(Promise.resolve(), -1), RangeError);
});

test('opening an existing wallet accepts only a .keys file', () => {
  assert.equal(isMoneroKeysFile('C:\\Wallets\\Savings.keys'), true);
  assert.equal(isMoneroKeysFile('/home/user/Wallet.keys'), true);
  assert.equal(isMoneroKeysFile('Wallet'), false);
  assert.equal(isMoneroKeysFile('Wallet.address.txt'), false);
  assert.equal(isMoneroKeysFile(null), false);
});
