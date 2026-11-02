'use strict';

const { validateMiningThreads } = require('./core');

const MAX_POOL_PASSWORD_LENGTH = 128;
const MAX_POOL_URL_LENGTH = 512;
const MAX_MINING_REQUEST_THREADS = 512;
const GIB = 1024 * 1024 * 1024;

const POOL_PRESETS = Object.freeze({
  hashvault: Object.freeze({ id: 'hashvault', name: 'HashVault', host: 'pool.hashvault.pro', port: 443, tls: true, password: 'x', coin: 'monero' }),
  supportxmr: Object.freeze({ id: 'supportxmr', name: 'SupportXMR', host: 'pool.supportxmr.com', port: 443, tls: true, password: 'x', coin: 'monero' }),
  moneroocean: Object.freeze({ id: 'moneroocean', name: 'MoneroOcean', host: 'gulf.moneroocean.stream', port: 20128, tls: true, password: 'josimi~rx/0', coin: null })
});

const DEFAULT_MINING_POOLS = Object.freeze(Object.values(POOL_PRESETS).map((pool) => Object.freeze({ ...pool })));

function validateMiningBooleanOptions(options = {}) {
  const keys = ['cpuAuto100', 'ignoreBattery', 'poolTls'];
  for (const key of keys) {
    if (typeof options[key] !== 'boolean') throw new TypeError(`Mining option ${key} must be Boolean.`);
  }
  return Object.fromEntries(keys.map((key) => [key, options[key]]));
}

function validateMiningRequest(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.getPrototypeOf(payload) !== Object.prototype) {
    throw new TypeError('Mining request must be a plain object.');
  }
  const allowedKeys = new Set(['threads', 'cpuAuto100', 'ignoreBattery', 'mode', 'poolPreset', 'poolUrl', 'poolTls', 'poolPassword', 'p2poolProfile']);
  for (const key of Object.keys(payload)) if (!allowedKeys.has(key)) throw new TypeError(`Unsupported mining request field: ${key}.`);
  const request = {
    threads: 1,
    cpuAuto100: false,
    ignoreBattery: false,
    mode: 'pool',
    poolPreset: 'moneroocean',
    poolUrl: '',
    poolTls: true,
    poolPassword: '',
    p2poolProfile: 'mini',
    ...payload
  };
  validateMiningBooleanOptions(request);
  if (typeof request.mode !== 'string' || !['pool', 'auto', 'p2pool', 'solo'].includes(request.mode)) throw new Error('지원하지 않는 채굴 방식입니다.');
  if (typeof request.poolPreset !== 'string' || (request.poolPreset !== 'custom' && !Object.hasOwn(POOL_PRESETS, request.poolPreset))) {
    throw new Error('지원하지 않는 채굴 풀 사전 설정입니다.');
  }
  if (typeof request.poolUrl !== 'string' || request.poolUrl.length > MAX_POOL_URL_LENGTH) throw new Error(`풀 주소는 문자열이며 최대 ${MAX_POOL_URL_LENGTH}자여야 합니다.`);
  if (typeof request.poolPassword !== 'string') throw new TypeError('풀 비밀번호/작업자 값은 문자열이어야 합니다.');
  normalizePoolPassword(request.poolPassword);
  if (typeof request.p2poolProfile !== 'string' || !['main', 'mini', 'nano'].includes(request.p2poolProfile)) throw new Error('P2Pool 프로필이 올바르지 않습니다.');
  let threads = request.threads;
  if (typeof threads === 'string') {
    if (!/^\d{1,3}$/.test(threads)) throw new RangeError(`채굴 스레드는 1부터 ${MAX_MINING_REQUEST_THREADS} 사이의 정수여야 합니다.`);
    threads = Number(threads);
  }
  if (!Number.isSafeInteger(threads) || threads < 1 || threads > MAX_MINING_REQUEST_THREADS) {
    throw new RangeError(`채굴 스레드는 1부터 ${MAX_MINING_REQUEST_THREADS} 사이의 정수여야 합니다.`);
  }
  return { ...request, threads };
}

function normalizePoolUrl(value, defaultTls = true) {
  if (typeof value !== 'string' || typeof defaultTls !== 'boolean') throw new TypeError('Pool URL must be a string and TLS selection must be Boolean.');
  const raw = value.trim();
  if (!raw) throw new Error('채굴 풀 주소를 입력하거나 사전 설정을 선택하세요.');
  const defaultProtocol = defaultTls ? 'stratum+ssl://' : 'stratum+tcp://';
  let parsed;
  try { parsed = new URL(raw.includes('://') ? raw : `${defaultProtocol}${raw}`); }
  catch (_) { throw new Error('풀 주소 형식이 올바르지 않습니다. host:port를 입력하세요.'); }
  if (!['stratum+tcp:', 'stratum+ssl:'].includes(parsed.protocol) || !parsed.hostname || !parsed.port) {
    throw new Error('풀 주소는 host:port 또는 stratum+ssl://host:port 형식이어야 합니다.');
  }
  const port = Number(parsed.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('풀 포트는 1부터 65535 사이여야 합니다.');
  if (parsed.username || parsed.password || (parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
    throw new Error('풀 주소에는 사용자명, 비밀번호, 경로 또는 추가 매개변수를 넣을 수 없습니다.');
  }
  const tls = parsed.protocol === 'stratum+ssl:';
  const target = parsed.host;
  return { id: 'custom', host: parsed.hostname.replace(/^\[|\]$/g, ''), port, tls, target, url: `${tls ? 'stratum+ssl' : 'stratum+tcp'}://${target}`, password: 'x', coin: 'monero' };
}

function normalizePoolPassword(value, fallback = 'x') {
  if ((value !== undefined && value !== null && typeof value !== 'string') || typeof fallback !== 'string') throw new TypeError('Pool password and fallback must be strings.');
  const password = value === undefined || value === null || value === '' ? fallback : value;
  if (!password || password.length > MAX_POOL_PASSWORD_LENGTH || /[\u0000-\u001f\u007f]/.test(password)) {
    throw new Error(`풀 비밀번호/작업자 값은 1~${MAX_POOL_PASSWORD_LENGTH}자이며 제어 문자를 포함할 수 없습니다.`);
  }
  return password;
}

function getPoolPreset(id) {
  const preset = typeof id === 'string' && Object.hasOwn(POOL_PRESETS, id) ? POOL_PRESETS[id] : null;
  if (!preset) throw new Error('지원하지 않는 채굴 풀 사전 설정입니다.');
  const target = `${preset.host}:${preset.port}`;
  return { ...preset, target, url: `${preset.tls ? 'stratum+ssl' : 'stratum+tcp'}://${target}` };
}

function createMiningPoolConfig({ poolId = 'moneroocean', poolUrl = '', poolTls = true, poolPassword } = {}) {
  if (typeof poolTls !== 'boolean') throw new TypeError('Pool TLS selection must be Boolean.');
  const pool = poolId === 'custom' ? normalizePoolUrl(poolUrl, poolTls) : getPoolPreset(poolId);
  const password = normalizePoolPassword(poolPassword, pool.password);
  return { ...pool, password };
}

function buildXmrigArgs({ mode, address, threadCount, cpuAuto100 = false, ignoreBattery = false, pool, p2poolEndpoint = '127.0.0.1:3333' } = {}) {
  const args = cpuAuto100 ? ['--cpu-max-threads-hint', '100', '--no-color'] : ['--threads', String(validateMiningThreads(threadCount)), '--no-color'];
  if (mode === 'p2pool') {
    args.push('-o', String(p2poolEndpoint));
  } else if (mode === 'pool' || mode === 'auto') {
    if (!pool || typeof address !== 'string' || !address) throw new Error('풀 채굴 설정이 완전하지 않습니다.');
    args.push('-o', pool.target, '-u', address, '-p', pool.password || 'x');
    if (pool.tls) args.push('--tls');
    if (pool.coin) args.push('--coin', pool.coin);
  } else {
    throw new Error('XMRig는 풀 또는 P2Pool 모드에서만 실행할 수 있습니다.');
  }
  if (!ignoreBattery) args.push('--pause-on-battery');
  return args;
}

function recommendMiningThreads(logicalProcessors, totalMemoryBytes) {
  if (!Number.isSafeInteger(logicalProcessors) || logicalProcessors < 1) throw new RangeError('CPU 논리 프로세서 수가 올바르지 않습니다.');
  if (!Number.isFinite(totalMemoryBytes) || totalMemoryBytes <= 0) throw new RangeError('시스템 메모리 용량이 올바르지 않습니다.');
  const memoryGiB = totalMemoryBytes / GIB;
  const divisor = memoryGiB <= 4 ? 4 : memoryGiB <= 8 ? 3 : 2;
  const recommendedThreads = Math.max(1, Math.floor(logicalProcessors / divisor));
  return {
    logicalProcessors,
    memoryGiB: Math.round(memoryGiB * 10) / 10,
    recommendedThreads,
    profile: memoryGiB <= 4 ? 'low-memory' : memoryGiB <= 8 ? 'balanced-memory' : 'balanced'
  };
}

module.exports = {
  MAX_POOL_PASSWORD_LENGTH,
  MAX_POOL_URL_LENGTH,
  MAX_MINING_REQUEST_THREADS,
  POOL_PRESETS,
  DEFAULT_MINING_POOLS,
  normalizePoolUrl,
  normalizePoolPassword,
  getPoolPreset,
  createMiningPoolConfig,
  buildXmrigArgs,
  validateMiningBooleanOptions,
  validateMiningRequest,
  recommendMiningThreads
};
