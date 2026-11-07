'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const os = require('node:os');
const path = require('node:path');
const { runWithCleanup, runElectronBuilder } = require('../scripts/build-windows');

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

test('electron-builder launches through Node argv without shell parsing checkout paths', async () => {
  const rootDir = path.join(os.tmpdir(), 'Josimi Build & Test', 'source tree');
  let invocation;
  await runElectronBuilder({
    rootDir,
    nodeExecutable: path.join('Program Files', 'node.exe'),
    spawnProcess: (executable, args, options) => {
      invocation = { executable, args, options };
      const child = new EventEmitter();
      process.nextTick(() => child.emit('close', 0, null));
      return child;
    }
  });
  assert.equal(invocation.executable, path.join('Program Files', 'node.exe'));
  assert.deepEqual(invocation.args, [path.join(rootDir, 'node_modules', 'electron-builder', 'cli.js'), '--win', 'zip']);
  assert.equal(invocation.options.cwd, rootDir);
  assert.equal(invocation.options.shell, undefined);
  assert.equal(invocation.options.windowsHide, true);
});

test('electron-builder launch failures retain a nonzero result', async () => {
  const spawnError = new Error('spawn failed');
  await assert.rejects(runElectronBuilder({
    spawnProcess: () => {
      const child = new EventEmitter();
      process.nextTick(() => child.emit('error', spawnError));
      return child;
    }
  }), /spawn failed/);
  await assert.rejects(runElectronBuilder({
    spawnProcess: () => {
      const child = new EventEmitter();
      process.nextTick(() => child.emit('close', 1, null));
      return child;
    }
  }), /electron-builder failed \(code 1/);
});
