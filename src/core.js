'use strict';

const ATOMIC_PER_XMR = 1000000000000n;
const SERVICE_FEE_CAP_ATOMIC = 50000000000n;

function atomicToXmr(value) {
  const atomic = BigInt(value);
  const whole = atomic / ATOMIC_PER_XMR;
  const fraction = (atomic % ATOMIC_PER_XMR).toString().padStart(12, '0').replace(/0+$/, '').padEnd(1, '0');
  return `${whole}.${fraction}`;
}

function xmrToAtomic(value) {
  const normalized = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,12})?$/.test(normalized)) throw new Error('XMR 금액 형식이 올바르지 않습니다.');
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * ATOMIC_PER_XMR + BigInt((fraction + '000000000000').slice(0, 12));
}

function calculateServiceFee(amountAtomic) {
  const amount = BigInt(amountAtomic);
  if (amount < 0n) throw new RangeError('송금 금액은 음수일 수 없습니다.');
  const computed = (amount * 25n) / 10000n;
  return computed > SERVICE_FEE_CAP_ATOMIC ? SERVICE_FEE_CAP_ATOMIC : computed;
}

function splitMiningThreads(count, limit) {
  const threads = Number(count);
  const maximum = Number(limit);
  if (!Number.isSafeInteger(threads) || !Number.isSafeInteger(maximum) || maximum < 20 || threads < 20 || threads > maximum || threads % 20 !== 0) {
    throw new RangeError(`5% 수수료 스레드 배분을 위해 총 CPU 스레드는 20개 이상, 20개 단위여야 합니다 (최대 ${maximum}).`);
  }
  const feeThreads = threads / 20;
  const userThreads = threads - feeThreads;
  return {
    totalThreads: threads,
    userThreads,
    feeThreads,
    userThreadPercent: (userThreads / threads) * 100,
    feeThreadPercent: (feeThreads / threads) * 100
  };
}

function isAllowedNodeRedirect(fromUrl, toUrl) {
  try {
    const from = new URL(fromUrl);
    const to = new URL(toUrl);
    return from.protocol === to.protocol && from.origin === to.origin && !to.username && !to.password;
  } catch (_) {
    return false;
  }
}

module.exports = {
  ATOMIC_PER_XMR,
  SERVICE_FEE_CAP_ATOMIC,
  atomicToXmr,
  xmrToAtomic,
  calculateServiceFee,
  splitMiningThreads,
  isAllowedNodeRedirect
};
