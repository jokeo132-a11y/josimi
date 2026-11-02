'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MINER_ACTIVITY_STALE_MS, applyMinerOutput, createMinerOutputParser, deriveMiningState, isMinerPoolReady } = require('../src/miner-status');

test('new jobs and accepted shares refresh connection activity while the share count remains historical', () => {
  const entry = { poolReady: false, lastPoolActivityAt: 0, sharesAccepted: 0 };
  assert.deepEqual(applyMinerOutput(entry, 'net new job from pool.example', 1000), {
    disconnected: false, newJob: true, accepted: false, connected: true
  });
  assert.equal(isMinerPoolReady(entry, 1000), true);
  applyMinerOutput(entry, 'net accepted (1/0) diff 100', 2000);
  assert.equal(entry.sharesAccepted, 1);
  assert.equal(isMinerPoolReady(entry, 2000), true);
  assert.equal(isMinerPoolReady(entry, 2000 + MINER_ACTIVITY_STALE_MS + 1), false);
  assert.equal(entry.sharesAccepted, 1);
});

test('disconnect output clears live pool state but does not erase historical accepted shares', () => {
  const entry = { poolReady: true, lastPoolActivityAt: 2000, sharesAccepted: 4 };
  const update = applyMinerOutput(entry, 'net error: connection reset, reconnecting in 5 seconds', 3000);
  assert.equal(update.disconnected, true);
  assert.equal(entry.poolReady, false);
  assert.equal(entry.lastPoolActivityAt, 0);
  assert.equal(entry.sharesAccepted, 4);
  assert.equal(isMinerPoolReady(entry, 3000), false);
});

test('an accepted event on a line also reporting a fresh job wins over disconnect wording', () => {
  const entry = { poolReady: true, lastPoolActivityAt: 1000, sharesAccepted: 0 };
  applyMinerOutput(entry, 'reconnecting; new job from pool.example; accepted (1/0)', 2000);
  assert.equal(entry.poolReady, true);
  assert.equal(entry.lastPoolActivityAt, 2000);
  assert.equal(entry.sharesAccepted, 1);
});

test('historical shares cannot force Mining after pool activity becomes stale or disconnects', () => {
  const common = { mode: 'pool', processCount: 1, expectedProcesses: 1, sharesAccepted: 7 };
  assert.equal(deriveMiningState({ ...common, connected: false }), 'connecting');
  assert.equal(deriveMiningState({ ...common, connected: true }), 'mining');
  assert.equal(deriveMiningState({ ...common, connected: false, mode: 'p2pool', processCount: 2, expectedProcesses: 2 }), 'connecting');
  assert.equal(deriveMiningState({ ...common, connected: false, mode: 'solo' }), 'mining');
  assert.equal(deriveMiningState({ ...common, connected: true, sharesAccepted: 0 }), 'connected');
});

test('complete accepted-share lines are counted across split and batched stream chunks', () => {
  const entry = { poolReady: false, lastPoolActivityAt: 0, sharesAccepted: 0 };
  const lines = [];
  const parser = createMinerOutputParser(entry, (line, update) => lines.push({ line, accepted: update.accepted }));
  parser.push('stdout', Buffer.from('net accepted (1/0) diff 100\nnet accepted (2/0)'));
  parser.push('stdout', Buffer.from(' diff 200\nnet accepted (3/0) diff 300\n'), 2000);
  parser.push('stderr', 'net new job');
  parser.push('stderr', ' from pool.example\n', 3000);
  assert.equal(entry.sharesAccepted, 3);
  assert.equal(entry.poolReady, true);
  assert.equal(entry.lastPoolActivityAt, 3000);
  assert.equal(lines.filter((item) => item.accepted).length, 3);
  assert.equal(lines.length, 4);
});

test('parser flushes one final unterminated line without double-counting it', () => {
  const entry = { poolReady: false, lastPoolActivityAt: 0, sharesAccepted: 0 };
  const parser = createMinerOutputParser(entry, () => {});
  parser.push('stdout', 'net accepted (1/0)');
  assert.equal(entry.sharesAccepted, 0);
  parser.flush('stdout', 4000);
  parser.flush('stdout', 5000);
  assert.equal(entry.sharesAccepted, 1);
  assert.equal(entry.lastPoolActivityAt, 4000);
});
