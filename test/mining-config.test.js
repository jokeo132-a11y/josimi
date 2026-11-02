'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const {
  DEFAULT_MINING_POOLS,
  createMiningPoolConfig,
  buildXmrigArgs,
  normalizePoolUrl,
  recommendMiningThreads,
  validateMiningBooleanOptions,
  validateMiningRequest,
  MAX_MINING_REQUEST_THREADS
} = require('../src/mining-config');
const { probeMiningPool } = require('../src/pool-probe');

const GIB = 1024 * 1024 * 1024;
const ADDRESS = '4'.repeat(95);

function fakeSocket() {
  const socket = new EventEmitter();
  socket.destroyed = false;
  socket.destroy = () => {
    socket.destroyed = true;
    socket.emit('close');
  };
  return socket;
}

test('MoneroOcean preset uses the documented TLS endpoint and worker/algorithm password', () => {
  const pool = createMiningPoolConfig({ poolId: 'moneroocean' });
  assert.equal(pool.host, 'gulf.moneroocean.stream');
  assert.equal(pool.port, 20128);
  assert.equal(pool.tls, true);
  assert.equal(pool.target, 'gulf.moneroocean.stream:20128');
  assert.equal(pool.password, 'josimi~rx/0');
  assert.equal(pool.coin, null);
  assert.ok(DEFAULT_MINING_POOLS.some((candidate) => candidate.id === 'moneroocean' && candidate.port === 20128 && candidate.tls));
});

test('MoneroOcean XMRig arguments use wallet login, configured worker password, and TLS without pinning another coin', () => {
  const pool = createMiningPoolConfig({ poolId: 'moneroocean' });
  const args = buildXmrigArgs({ mode: 'pool', address: ADDRESS, threadCount: 4, pool, ignoreBattery: false });
  assert.deepEqual(args.slice(0, 8), ['--threads', '4', '--no-color', '-o', 'gulf.moneroocean.stream:20128', '-u', ADDRESS, '-p']);
  assert.equal(args[8], 'josimi~rx/0');
  assert.ok(args.includes('--tls'));
  assert.ok(args.includes('--pause-on-battery'));
  assert.ok(!args.includes('--coin'));
});

test('generic pool presets use the standard XMRig coin and a compatible default password', () => {
  const pool = createMiningPoolConfig({ poolId: 'hashvault' });
  const args = buildXmrigArgs({ mode: 'pool', address: ADDRESS, threadCount: 2, pool, ignoreBattery: true });
  assert.ok(args.includes('pool.hashvault.pro:443'));
  assert.ok(args.includes('x'));
  assert.ok(args.includes('--coin'));
  assert.ok(args.includes('monero'));
  assert.ok(args.includes('--tls'));
  assert.ok(!args.includes('--pause-on-battery'));
});

test('custom Stratum pool accepts explicit TLS/plain schemes and rejects unsafe or invalid URLs', () => {
  const tlsPool = normalizePoolUrl('stratum+ssl://mine.example:4444');
  assert.equal(tlsPool.target, 'mine.example:4444');
  assert.equal(tlsPool.tls, true);
  const plainPool = normalizePoolUrl('mine.example:3333', false);
  assert.equal(plainPool.url, 'stratum+tcp://mine.example:3333');
  assert.equal(plainPool.tls, false);
  assert.equal(normalizePoolUrl('stratum+tcp://[::1]:3333').target, '[::1]:3333');
  for (const value of ['', 'mine.example', 'mine.example:0', 'https://mine.example:443', 'stratum+ssl://user:pass@mine.example:443', 'stratum+ssl://mine.example:443/path', 'stratum+ssl://mine.example:443?user=x']) {
    assert.throws(() => normalizePoolUrl(value), { message: /풀/ });
  }
  assert.throws(() => createMiningPoolConfig({ poolId: 'unknown' }), /사전 설정/);
  assert.throws(() => createMiningPoolConfig({ poolId: 'custom', poolUrl: 'mine.example:3333', poolPassword: 'bad\nvalue' }), /제어 문자/);
});

test('mining IPC Boolean options reject truthy strings and other non-Boolean values', () => {
  assert.deepEqual(validateMiningBooleanOptions({ cpuAuto100: true, ignoreBattery: false, poolTls: true }), { cpuAuto100: true, ignoreBattery: false, poolTls: true });
  for (const value of ['false', 'true', 0, 1, null]) {
    assert.throws(() => validateMiningBooleanOptions({ cpuAuto100: value }), /Boolean/);
    assert.throws(() => validateMiningBooleanOptions({ ignoreBattery: value }), /Boolean/);
    assert.throws(() => validateMiningBooleanOptions({ poolTls: value }), /Boolean/);
  }
});

test('mining IPC request schema validates types, bounds, and preset own-properties', () => {
  const valid = validateMiningRequest({ threads: '12', mode: 'pool', poolPreset: 'moneroocean', poolTls: true, cpuAuto100: false, ignoreBattery: false });
  assert.equal(valid.threads, 12);
  assert.equal(validateMiningRequest({ threads: MAX_MINING_REQUEST_THREADS }).threads, MAX_MINING_REQUEST_THREADS);
  for (const payload of [
    { threads: { value: 4 } },
    { threads: 513 },
    { threads: '1e3' },
    { mode: 'constructor' },
    { poolPreset: 'constructor' },
    { poolPreset: 'toString' },
    { poolUrl: 'a'.repeat(513) },
    { poolPassword: 42 },
    { p2poolProfile: 'other' },
    { ignoreBattery: 'false' },
    { unrecognized: true }
  ]) assert.throws(() => validateMiningRequest(payload));
  assert.throws(() => validateMiningRequest(null));
  assert.throws(() => validateMiningRequest(Object.create(null)));
  assert.throws(() => createMiningPoolConfig({ poolId: 'constructor' }), /사전 설정/);
  assert.throws(() => createMiningPoolConfig({ poolId: 'custom', poolUrl: 'mine.example:3333', poolTls: 'false' }), /Boolean/);
  assert.throws(() => normalizePoolUrl(12), /string/);
});

test('P2Pool XMRig connects only to loopback Stratum and does not receive wallet credentials', () => {
  const args = buildXmrigArgs({ mode: 'p2pool', address: ADDRESS, threadCount: 3, p2poolEndpoint: '127.0.0.1:3333', ignoreBattery: true });
  assert.deepEqual(args, ['--threads', '3', '--no-color', '-o', '127.0.0.1:3333']);
  assert.ok(!args.includes(ADDRESS));
  assert.ok(!args.includes('-u'));
  assert.ok(!args.includes('-p'));
  assert.ok(!args.includes('--coin'));
});

test('pool probe has an absolute deadline even when a TLS connection never emits events', async () => {
  const socket = fakeSocket();
  await assert.rejects(probeMiningPool({ host: 'pool.example', port: 443, tls: true }, { timeoutMs: 25, socketFactory: () => socket }), /제한 시간/);
  assert.equal(socket.destroyed, true);
});

test('pool probe resolves on TLS handshake and destroys the probe socket', async () => {
  const socket = fakeSocket();
  const pool = { id: 'test', host: 'pool.example', port: 443, tls: true };
  const resultPromise = probeMiningPool(pool, {
    timeoutMs: 100,
    socketFactory: () => {
      process.nextTick(() => socket.emit('secureConnect'));
      return socket;
    }
  });
  const result = await resultPromise;
  assert.deepEqual(result, { ...pool, latency: result.latency });
  assert.equal(socket.destroyed, true);
  assert.equal(Number.isFinite(result.latency), true);
});

test('hardware recommendations leave a conservative CPU share and reduce load on smaller-memory systems', () => {
  assert.deepEqual(recommendMiningThreads(16, 16 * GIB), { logicalProcessors: 16, memoryGiB: 16, recommendedThreads: 8, profile: 'balanced' });
  assert.equal(recommendMiningThreads(12, 8 * GIB).recommendedThreads, 4);
  assert.equal(recommendMiningThreads(8, 4 * GIB).recommendedThreads, 2);
  assert.equal(recommendMiningThreads(1, 2 * GIB).recommendedThreads, 1);
  for (const processors of [0, -1, 1.5, NaN]) assert.throws(() => recommendMiningThreads(processors, 8 * GIB), RangeError);
  assert.throws(() => recommendMiningThreads(2, 0), RangeError);
});
