'use strict';

const net = require('node:net');
const tls = require('node:tls');

function probeMiningPool(pool, { timeoutMs = 4500, socketFactory } = {}) {
  if (!pool || typeof pool.host !== 'string' || !pool.host || !Number.isInteger(pool.port) || pool.port < 1 || pool.port > 65535) {
    return Promise.reject(new TypeError('Mining pool endpoint is invalid.'));
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    return Promise.reject(new RangeError('Pool probe timeout must be positive.'));
  }

  const started = Date.now();
  return new Promise((resolve, reject) => {
    let socket;
    let settled = false;
    const timer = setTimeout(() => finish(new Error('풀 연결이 제한 시간 안에 완료되지 않았습니다.')), timeoutMs);
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (socket && !socket.destroyed) socket.destroy();
      if (error) reject(error);
      else resolve({ ...pool, latency: Date.now() - started });
    };

    try {
      socket = socketFactory
        ? socketFactory(pool)
        : pool.tls
          ? tls.connect({ host: pool.host, port: pool.port, servername: pool.host })
          : net.createConnection({ host: pool.host, port: pool.port });
    } catch (error) {
      finish(error);
      return;
    }

    socket.once(pool.tls ? 'secureConnect' : 'connect', () => finish());
    socket.once('error', (error) => finish(error));
    socket.once('close', () => {
      if (!settled) finish(new Error('풀 연결이 준비되기 전에 종료되었습니다.'));
    });
  });
}

module.exports = { probeMiningPool };
