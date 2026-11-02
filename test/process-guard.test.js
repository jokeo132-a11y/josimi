'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { markProcessClosed, isProcessCloseConfirmed, waitForProcessClose } = require('../src/process-guard');

function fakeChild() {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  child.kill = () => true;
  return child;
}

test('a miner error and non-null exit code are not proof that child close was observed', async () => {
  const child = fakeChild();
  const entry = { child, role: 'P2Pool', closeSeen: false };
  child.on('error', () => {});
  const closePromise = waitForProcessClose(entry, { timeoutMs: 500 });
  child.exitCode = 1;
  child.emit('error', new Error('post-spawn transport error'));
  let settled = false;
  closePromise.then(() => { settled = true; }, () => { settled = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);
  assert.equal(isProcessCloseConfirmed(child, entry), false);
  child.emit('close', 1, null);
  assert.equal(await closePromise, true);
  assert.equal(entry.closeSeen, true);
  assert.equal(isProcessCloseConfirmed(child, entry), true);
});

test('a process without a close event times out and remains unconfirmed', async () => {
  const child = fakeChild();
  const entry = { child, role: 'P2Pool', closeSeen: false };
  child.exitCode = 0;
  await assert.rejects(waitForProcessClose(entry, { timeoutMs: 20 }), { code: 'MINER_CLOSE_UNCONFIRMED' });
  assert.equal(isProcessCloseConfirmed(child, entry), false);
});

test('an observed close event is retained for later shutdown retries', async () => {
  const child = fakeChild();
  const entry = { child, role: 'XMRig', closeSeen: false };
  markProcessClosed(child);
  assert.equal(await waitForProcessClose(entry), true);
  assert.equal(isProcessCloseConfirmed(child, entry), true);
});
