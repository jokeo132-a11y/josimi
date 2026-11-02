'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { HEALTH_MARKER, isExpectedHealthResponse, waitForP2PoolStratum } = require('../src/p2pool-probe');

async function startServer(handler) {
  const server = net.createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return { server, port: server.address().port };
}

async function closeServer(server) {
  if (!server.listening) return;
  await new Promise((resolve) => server.close(resolve));
}

test('P2Pool readiness requires its upstream Stratum HTTP health marker', async (t) => {
  const { server, port } = await startServer((socket) => {
    let request = '';
    socket.on('data', (chunk) => {
      request += chunk.toString();
      if (!request.includes('\r\n\r\n')) return;
      socket.end('HTTP/1.1 200 OK\r\nContent-Length: 21\r\nContent-Type: text/plain\r\nConnection: Closed\r\n\r\nP2Pool Stratum online');
    });
  });
  t.after(() => closeServer(server));
  assert.equal(await waitForP2PoolStratum('127.0.0.1', port, 1000), true);
});

test('P2Pool health parser requires the exact upstream status, headers, and body', () => {
  const valid = Buffer.from(`HTTP/1.1 200 OK\r\nContent-Length: 21\r\nContent-Type: text/plain\r\nConnection: Closed\r\n\r\n${HEALTH_MARKER}`);
  assert.equal(isExpectedHealthResponse(valid), null);
  assert.equal(isExpectedHealthResponse(valid, true), true);
  const invalidResponses = [
    `HTTP/1.1 500 OK\r\nContent-Length: 21\r\nContent-Type: text/plain\r\nConnection: Closed\r\n\r\n${HEALTH_MARKER}`,
    `HTTP/1.1 200 OK\r\nX-Notice: ${HEALTH_MARKER}\r\nContent-Length: 4\r\nContent-Type: text/plain\r\nConnection: Closed\r\n\r\nnope`,
    `HTTP/1.1 200 OK\r\nContent-Length: 21\r\nContent-Type: text/plain\r\nConnection: Closed\r\n\r\n${HEALTH_MARKER}!`,
    `HTTP/1.1 200 OK\r\nContent-Length: 20\r\nContent-Type: text/plain\r\nConnection: Closed\r\n\r\n${HEALTH_MARKER}`
  ];
  for (const response of invalidResponses) assert.equal(isExpectedHealthResponse(Buffer.from(response), true), false);
});

test('P2Pool readiness rejects an unrelated TCP/HTTP listener', async (t) => {
  const { server, port } = await startServer((socket) => {
    socket.on('data', () => socket.end('HTTP/1.1 200 OK\r\nContent-Length: 4\r\n\r\nnope'));
  });
  t.after(() => closeServer(server));
  await assert.rejects(waitForP2PoolStratum('127.0.0.1', port, 1000), /not the expected P2Pool Stratum service/);
});

test('P2Pool readiness respects an immediate cancellation request', async () => {
  await assert.rejects(waitForP2PoolStratum('127.0.0.1', 3333, 1000, () => true), /취소/);
});
