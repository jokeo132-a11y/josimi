'use strict';

const confirmedClosed = new WeakSet();

function markProcessClosed(child) {
  if (child && typeof child === 'object') confirmedClosed.add(child);
}

function isProcessCloseConfirmed(child, entry) {
  return Boolean(child && (entry?.closeSeen === true || confirmedClosed.has(child)));
}

function waitForProcessClose(entry, { timeoutMs = 10_000 } = {}) {
  const child = entry?.child;
  if (!child || typeof child.once !== 'function') return Promise.reject(new TypeError('A child process handle is required.'));
  if (isProcessCloseConfirmed(child, entry)) return Promise.resolve(true);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) return Promise.reject(new RangeError('Process close timeout must be positive.'));

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      child.removeListener('close', onClose);
    };
    const onClose = () => {
      if (entry && typeof entry === 'object') entry.closeSeen = true;
      markProcessClosed(child);
      if (settled) return;
      settled = true;
      cleanup();
      resolve(true);
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      const error = new Error(`${entry.role || 'Mining'} 프로세스 종료를 확인하지 못했습니다.`);
      error.code = 'MINER_CLOSE_UNCONFIRMED';
      reject(error);
    }, timeoutMs);
    child.once('close', onClose);
  });
}

module.exports = { markProcessClosed, isProcessCloseConfirmed, waitForProcessClose };
