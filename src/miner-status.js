'use strict';

const MINER_ACTIVITY_STALE_MS = 10 * 60 * 1000;
const MAX_MINER_LOG_LINE_CHARS = 8192;
const NEW_JOB = /\bnew job(?:\s+from)?\b/i;
const ACCEPTED_SHARE = /\baccepted\b/i;
const POOL_DISCONNECTED = /\b(?:disconnected|disconnecting|reconnecting|connection\s+(?:failed|closed|reset|refused|lost)|network\s+error|no\s+active\s+pools|retrying\s+in|end\s+of\s+file)\b/i;

function applyMinerOutput(entry, text, now = Date.now()) {
  if (!entry || typeof entry !== 'object' || typeof text !== 'string' || !Number.isFinite(now)) {
    throw new TypeError('Miner output, entry, and timestamp must be valid.');
  }
  const disconnected = POOL_DISCONNECTED.test(text);
  if (disconnected) {
    entry.poolReady = false;
    entry.lastPoolActivityAt = 0;
  }
  const newJob = NEW_JOB.test(text);
  const accepted = ACCEPTED_SHARE.test(text);
  if (newJob || accepted) {
    entry.poolReady = true;
    entry.lastPoolActivityAt = now;
  }
  if (accepted) entry.sharesAccepted = (Number.isSafeInteger(entry.sharesAccepted) ? entry.sharesAccepted : 0) + 1;
  return { disconnected, newJob, accepted, connected: Boolean(entry.poolReady) };
}

function createMinerOutputParser(entry, onLine) {
  if (!entry || typeof entry !== 'object' || typeof onLine !== 'function') throw new TypeError('Miner output parser requires an entry and line handler.');
  const buffers = new Map([['stdout', ''], ['stderr', '']]);
  const deliver = (line, now) => {
    const text = line.trim();
    if (!text) return;
    onLine(text, applyMinerOutput(entry, text, now));
  };
  return {
    push(stream, chunk, now = Date.now()) {
      if (!buffers.has(stream) || !Number.isFinite(now)) throw new TypeError('Miner stream and timestamp must be valid.');
      const input = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      const combined = buffers.get(stream) + input;
      const lines = combined.split(/\r\n|\n|\r/);
      let remainder = lines.pop() || '';
      if (remainder.length > MAX_MINER_LOG_LINE_CHARS) remainder = remainder.slice(-MAX_MINER_LOG_LINE_CHARS);
      buffers.set(stream, remainder);
      for (const line of lines) deliver(line, now);
    },
    flush(stream, now = Date.now()) {
      if (!buffers.has(stream) || !Number.isFinite(now)) throw new TypeError('Miner stream and timestamp must be valid.');
      const remainder = buffers.get(stream);
      buffers.set(stream, '');
      deliver(remainder, now);
    }
  };
}

function isMinerPoolReady(entry, now = Date.now(), staleMs = MINER_ACTIVITY_STALE_MS) {
  if (!entry || typeof entry !== 'object' || !entry.poolReady || !Number.isFinite(entry.lastPoolActivityAt) || !Number.isFinite(now) || !Number.isFinite(staleMs) || staleMs < 0) return false;
  const age = now - entry.lastPoolActivityAt;
  return age >= 0 && age <= staleMs;
}

function deriveMiningState({ starting = false, mode = 'pool', processCount = 0, expectedProcesses = 1, connected = false, sharesAccepted = 0 } = {}) {
  if (starting) return 'starting';
  if (processCount < expectedProcesses) return processCount > 0 ? 'partial' : 'stopped';
  if (mode === 'solo') return 'mining';
  if (!connected) return 'connecting';
  return sharesAccepted > 0 ? 'mining' : 'connected';
}

module.exports = { MINER_ACTIVITY_STALE_MS, applyMinerOutput, createMinerOutputParser, deriveMiningState, isMinerPoolReady };
