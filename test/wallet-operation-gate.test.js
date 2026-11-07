'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { WalletOperationGate } = require('../src/wallet-operation-gate');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

test('wallet operation gate rejects concurrent transitions and releases after completion', async () => {
  const gate = new WalletOperationGate('transition busy');
  const pending = deferred();
  const first = gate.run(() => pending.promise);
  assert.equal(gate.busy, true);
  let becameIdle = false;
  const idle = gate.waitForIdle().then(() => { becameIdle = true; });
  await assert.rejects(gate.run(() => 'should not run'), /transition busy/);
  assert.equal(becameIdle, false);
  pending.resolve('first');
  assert.equal(await first, 'first');
  await idle;
  assert.equal(becameIdle, true);
  assert.equal(gate.busy, false);
  assert.equal(await gate.run(() => 'next'), 'next');
});

test('wallet operation gate releases after thrown and rejected operations', async () => {
  const gate = new WalletOperationGate();
  await assert.rejects(gate.run(() => { throw new Error('sync failure'); }), /sync failure/);
  assert.equal(gate.busy, false);
  await assert.rejects(gate.run(() => Promise.reject(new Error('async failure'))), /async failure/);
  assert.equal(gate.busy, false);
  await gate.waitForIdle();
  assert.equal(await gate.run(() => 1), 1);
});
