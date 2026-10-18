'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  atomicToXmr,
  xmrToAtomic,
  calculateServiceFee,
  SERVICE_FEE_CAP_ATOMIC,
  splitMiningThreads,
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

test('dual-miner thread allocation keeps fee threads at exactly five percent', () => {
  for (const count of [20, 40, 60]) {
    const split = splitMiningThreads(count, 64);
    assert.equal(split.userThreads + split.feeThreads, count);
    assert.ok(split.userThreads >= 1);
    assert.ok(split.feeThreads >= 1);
    assert.equal(split.feeThreadPercent, 5);
  }
  assert.deepEqual(splitMiningThreads(20, 64), {
    totalThreads: 20,
    userThreads: 19,
    feeThreads: 1,
    userThreadPercent: 95,
    feeThreadPercent: 5
  });
});

test('dual-miner thread allocation rejects values that cannot preserve the 5% fee split', () => {
  for (const count of [0, 1, 2, 19, 21, 39, 65, NaN]) assert.throws(() => splitMiningThreads(count, 64), RangeError);
  assert.throws(() => splitMiningThreads(20, 19), RangeError);
});

test('remote node redirects cannot downgrade protocol or change origin', () => {
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'https://node.example/rpc2'), true);
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'http://node.example/rpc'), false);
  assert.equal(isAllowedNodeRedirect('https://node.example/rpc', 'https://other.example/rpc'), false);
  assert.equal(isAllowedNodeRedirect('http://127.0.0.1:18081/json_rpc', 'http://localhost:18081/json_rpc'), false);
  assert.equal(isAllowedNodeRedirect('not a url', 'https://node.example/'), false);
});
