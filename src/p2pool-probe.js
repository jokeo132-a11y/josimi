'use strict';

const net = require('node:net');

const HEALTH_MARKER = 'P2Pool Stratum online';
const HEALTH_REQUEST = 'GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n';
const MAX_RESPONSE_BYTES = 4096;

function isExpectedHealthResponse(response, complete = false) {
  const headerEnd = response.indexOf(Buffer.from('\r\n\r\n'));
  if (headerEnd < 0) return complete ? false : null;
  const lines = response.subarray(0, headerEnd).toString('ascii').split('\r\n');
  if (!/^HTTP\/1\.[01] 200 OK$/i.test(lines[0] || '')) return false;
  const headers = new Map();
  for (const line of lines.slice(1)) {
    const separator = line.indexOf(':');
    if (separator <= 0) return false;
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (headers.has(name)) return false;
    headers.set(name, value);
  }
  if (headers.get('content-type')?.toLowerCase() !== 'text/plain' || headers.get('connection')?.toLowerCase() !== 'closed') return false;
  const contentLength = headers.get('content-length');
  if (!/^\d+$/.test(contentLength || '') || Number(contentLength) !== Buffer.byteLength(HEALTH_MARKER)) return false;
  const body = response.subarray(headerEnd + 4);
  if (body.length < Number(contentLength)) return complete ? false : null;
  if (body.length !== Number(contentLength) || !body.equals(Buffer.from(HEALTH_MARKER, 'ascii'))) return false;
  return complete ? true : null;
}

function waitForP2PoolStratum(host, port, timeoutMs = 60_000, shouldStop = () => false) {
  if (typeof host !== 'string' || !host || !Number.isInteger(port) || port < 1 || port > 65535) {
    return Promise.reject(new TypeError('P2Pool Stratum endpoint is invalid.'));
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    return Promise.reject(new RangeError('P2Pool Stratum timeout must be positive.'));
  }

  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    let settled = false;
    let activeSocket = null;
    let attemptTimer = null;
    let retryTimer = null;
    let deadlineTimer = null;
    let cancelTimer = null;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(attemptTimer);
      clearTimeout(retryTimer);
      clearTimeout(deadlineTimer);
      clearInterval(cancelTimer);
      if (activeSocket && !activeSocket.destroyed) activeSocket.destroy();
      if (error) reject(error);
      else resolve(true);
    };

    const scheduleRetry = () => {
      if (settled) return;
      if (shouldStop()) return finish(new Error('P2Pool 시작이 취소되었습니다.'));
      const remaining = deadline - Date.now();
      if (remaining <= 0) return finish(new Error('로컬 P2Pool Stratum이 제한 시간 안에 준비되지 않았습니다.'));
      retryTimer = setTimeout(attempt, Math.min(350, remaining));
    };

    const attempt = () => {
      if (settled) return;
      if (shouldStop()) return finish(new Error('P2Pool 시작이 취소되었습니다.'));
      if (Date.now() >= deadline) return finish(new Error('로컬 P2Pool Stratum이 제한 시간 안에 준비되지 않았습니다.'));

      let connected = false;
      let retryScheduled = false;
      let response = Buffer.alloc(0);
      let socket;
      try {
        socket = net.createConnection({ host, port });
      } catch (_) {
        scheduleRetry();
        return;
      }
      activeSocket = socket;
      const connectBudget = Math.min(1500, Math.max(1, deadline - Date.now()));
      attemptTimer = setTimeout(() => {
        if (connected) {
          finish(new Error('P2Pool Stratum did not return its health response in time.'));
        } else if (!retryScheduled) {
          retryScheduled = true;
          socket.destroy();
          scheduleRetry();
        }
      }, connectBudget);

      socket.once('connect', () => {
        connected = true;
        clearTimeout(attemptTimer);
        attemptTimer = setTimeout(() => {
          finish(new Error('Port 3333 did not identify itself as the local P2Pool Stratum service.'));
        }, Math.min(1500, Math.max(1, deadline - Date.now())));
        try {
          socket.write(HEALTH_REQUEST);
        } catch (_) {
          finish(new Error('Could not query the local P2Pool Stratum service.'));
        }
      });

      socket.on('data', (chunk) => {
        if (settled) return;
        response = Buffer.concat([response, chunk]);
        if (response.length > MAX_RESPONSE_BYTES) {
          return finish(new Error('Port 3333 returned an oversized, non-P2Pool health response.'));
        }
        const result = isExpectedHealthResponse(response);
        if (result === true) finish();
        else if (result === false) finish(new Error('Port 3333 is not the expected P2Pool Stratum service.'));
      });

      socket.once('error', () => {
        if (settled) return;
        if (connected) {
          finish(new Error('The local P2Pool Stratum health check failed.'));
        } else if (!retryScheduled) {
          retryScheduled = true;
          clearTimeout(attemptTimer);
          socket.destroy();
          scheduleRetry();
        }
      });

      socket.once('end', () => {
        if (settled) return;
        if (connected) {
          if (isExpectedHealthResponse(response, true) === true) finish();
          else finish(new Error('Port 3333 is not the expected P2Pool Stratum service.'));
        } else if (!retryScheduled) {
          retryScheduled = true;
          clearTimeout(attemptTimer);
          scheduleRetry();
        }
      });

      socket.once('close', () => {
        if (settled) return;
        if (connected) {
          finish(new Error('Port 3333 closed without the expected P2Pool health marker.'));
        } else if (!retryScheduled) {
          retryScheduled = true;
          clearTimeout(attemptTimer);
          scheduleRetry();
        }
      });
    };

    deadlineTimer = setTimeout(() => {
      finish(new Error('로컬 P2Pool Stratum이 제한 시간 안에 준비되지 않았습니다.'));
    }, timeoutMs);
    cancelTimer = setInterval(() => {
      if (shouldStop()) finish(new Error('P2Pool 시작이 취소되었습니다.'));
    }, 100);
    attempt();
  });
}

module.exports = { HEALTH_MARKER, isExpectedHealthResponse, waitForP2PoolStratum };
