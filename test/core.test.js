'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  atomicToXmr,
  xmrToAtomic,
  calculateServiceFee,
  SERVICE_FEE_CAP_ATOMIC,
  validateMiningThreads,
  isAllowedNodeRedirect
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

test('remote node redirects cannot downgrade protocol or change origin', () => {
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'https://node.example/rpc2'), true);
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'http://node.example/rpc'), false);
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'https://other.example/rpc'), false);
  assert.equal(isAllowedNodeRedirect('http://127.0.0.1:18081/json_rpc', 'http://localhost:18081/json_rpc'), false);
  assert.equal(isAllowedNodeRedirect('not a url', 'https://node.example/'), false);
});
