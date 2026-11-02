'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runWithCleanup } = require('../scripts/build-windows');

test('Windows packaging cleanup runs after preparation failure', async () => {
  let buildCalled = false;
  let cleanupCalled = 0;
  await assert.rejects(runWithCleanup(
    async () => { throw new Error('prepare failed'); },
    async () => { buildCalled = true; },
    async () => { cleanupCalled += 1; }
  ), /prepare failed/);
  assert.equal(buildCalled, false);
  assert.equal(cleanupCalled, 1);
});

test('Windows packaging cleanup runs after build failure', async () => {
  let cleanupCalled = 0;
  await assert.rejects(runWithCleanup(
    async () => {},
    async () => { throw new Error('builder failed'); },
    async () => { cleanupCalled += 1; }
  ), /builder failed/);
  assert.equal(cleanupCalled, 1);
});

test('Windows packaging cleanup runs after a successful build and reports cleanup errors', async () => {
  const order = [];
  await runWithCleanup(
    async () => { order.push('prepare'); },
    async () => { order.push('build'); },
    async () => { order.push('cleanup'); }
  );
  assert.deepEqual(order, ['prepare', 'build', 'cleanup']);
  await assert.rejects(runWithCleanup(async () => {}, async () => {}, async () => { throw new Error('cleanup failed'); }), /cleanup failed/);
});
