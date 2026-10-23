'use strict';

const ATOMIC_PER_XMR = 1000000000000n;
const MAX_ATOMIC = 18446744073709551615n;
const SERVICE_FEE_CAP_ATOMIC = 50000000000n;
const MAX_WALLET_LABEL_LENGTH = 80;
const MAX_TRANSACTION_NOTE_LENGTH = 500;

function atomicToXmr(value) {
  const atomic = BigInt(value);
  if (atomic < 0n || atomic > MAX_ATOMIC) throw new RangeError('원자 단위 금액 범위를 벗어났습니다.');
  const whole = atomic / ATOMIC_PER_XMR;
  const fraction = (atomic % ATOMIC_PER_XMR).toString().padStart(12, '0').replace(/0+$/, '').padEnd(1, '0');
  return `${whole}.${fraction}`;
}

function xmrToAtomic(value) {
  const normalized = String(value ?? '').trim();
  if (normalized.length > 32 || !/^\d+(\.\d{1,12})?$/.test(normalized)) throw new Error('XMR 금액 형식이 올바르지 않습니다.');
  const [whole, fraction = ''] = normalized.split('.');
  const atomic = BigInt(whole) * ATOMIC_PER_XMR + BigInt((fraction + '000000000000').slice(0, 12));
  if (atomic > MAX_ATOMIC) throw new RangeError('XMR 금액이 너무 큽니다.');
  return atomic;
}

function calculateServiceFee(amountAtomic) {
  const amount = BigInt(amountAtomic);
  if (amount < 0n || amount > MAX_ATOMIC) throw new RangeError('송금 금액 범위를 벗어났습니다.');
  const computed = (amount * 25n) / 10000n;
  return computed > SERVICE_FEE_CAP_ATOMIC ? SERVICE_FEE_CAP_ATOMIC : computed;
}

function validateMiningThreads(count) {
  if (typeof count === 'boolean' || (typeof count === 'string' && count.trim() === '')) throw new RangeError('채굴 스레드는 1 이상의 정수여야 합니다.');
  const threads = Number(count);
  if (!Number.isSafeInteger(threads) || threads < 1) throw new RangeError('채굴 스레드는 1 이상의 정수여야 합니다.');
  return threads;
}

function normalizeWalletIndex(value, field = '지갑 인덱스') {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) throw new RangeError(`${field}는 0 이상의 정수여야 합니다.`);
  const index = Number(value);
  if (!Number.isSafeInteger(index) || index < 0) throw new RangeError(`${field}는 0 이상의 정수여야 합니다.`);
  return index;
}

function normalizeWalletLabel(value, field = '라벨') {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new TypeError(`${field} 형식이 올바르지 않습니다.`);
  const label = value.trim();
  if (label.length > MAX_WALLET_LABEL_LENGTH) throw new RangeError(`${field}은 ${MAX_WALLET_LABEL_LENGTH}자 이하여야 합니다.`);
  return label;
}

function normalizeTransactionNote(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new TypeError('거래 메모 형식이 올바르지 않습니다.');
  const note = value.trim();
  if (note.length > MAX_TRANSACTION_NOTE_LENGTH) throw new RangeError(`거래 메모는 ${MAX_TRANSACTION_NOTE_LENGTH}자 이하여야 합니다.`);
  return note;
}

function isMoneroKeysFile(filePath) {
  return typeof filePath === 'string' && filePath.toLowerCase().endsWith('.keys');
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
  MAX_ATOMIC,
  SERVICE_FEE_CAP_ATOMIC,
  MAX_WALLET_LABEL_LENGTH,
  MAX_TRANSACTION_NOTE_LENGTH,
  atomicToXmr,
  xmrToAtomic,
  calculateServiceFee,
  validateMiningThreads,
  normalizeWalletIndex,
  normalizeWalletLabel,
  normalizeTransactionNote,
  isMoneroKeysFile,
  isAllowedNodeRedirect
};
