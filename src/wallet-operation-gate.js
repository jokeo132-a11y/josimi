'use strict';

class WalletOperationGate {
  constructor(message = '지갑 작업이 이미 진행 중입니다. 끝날 때까지 기다려 주세요.') {
    this.message = message;
    this.busy = false;
    this.idlePromise = null;
    this.resolveIdle = null;
  }

  run(operation) {
    if (typeof operation !== 'function') return Promise.reject(new TypeError('Wallet operation must be a function.'));
    if (this.busy) return Promise.reject(new Error(this.message));
    this.busy = true;
    this.idlePromise = new Promise((resolve) => { this.resolveIdle = resolve; });
    return Promise.resolve()
      .then(operation)
      .finally(() => {
        this.busy = false;
        this.idlePromise = null;
        const resolveIdle = this.resolveIdle;
        this.resolveIdle = null;
        resolveIdle?.();
      });
  }

  waitForIdle() {
    return this.idlePromise || Promise.resolve();
  }
}

module.exports = { WalletOperationGate };
