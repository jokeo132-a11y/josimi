'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const STORE_VERSION = 1;
const MAX_RECORDS = 64;
const SAFE_RECORD_FIELDS = new Set(['pendingId', 'state', 'txHashes', 'createdAt']);
const STORED_RECORD_FIELDS = new Set(['walletId', ...SAFE_RECORD_FIELDS]);

function walletKey(walletPath) {
  if (typeof walletPath !== 'string' || !walletPath.trim()) throw new TypeError('Wallet path is required for a relay recovery record.');
  const resolvedPath = path.resolve(walletPath);
  const identityPath = process.platform === 'win32' ? resolvedPath.toLowerCase() : resolvedPath;
  return crypto.createHash('sha256').update(identityPath).digest('hex');
}

function validateRecord(record) {
  return Boolean(record && typeof record === 'object' && !Array.isArray(record)
    && Object.keys(record).length === STORED_RECORD_FIELDS.size
    && Object.keys(record).every((key) => STORED_RECORD_FIELDS.has(key))
    && typeof record.walletId === 'string' && /^[a-f0-9]{64}$/i.test(record.walletId)
    && typeof record.pendingId === 'string' && /^[a-f0-9]{48}$/i.test(record.pendingId)
    && ['relaying', 'relay-unknown', 'relayed'].includes(record.state)
    && Array.isArray(record.txHashes) && record.txHashes.length <= 16
    && record.txHashes.every((hash) => typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash))
    && Number.isSafeInteger(record.createdAt) && record.createdAt > 0);
}

function syncDirectory(directory) {
  let fd;
  try {
    fd = fs.openSync(directory, 'r');
    fs.fsyncSync(fd);
  } catch (error) {
    const failure = new Error(`Relay recovery directory sync failed; transaction relay is blocked. (${error.message})`);
    failure.code = 'EDIRSYNC';
    throw failure;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function durableMoveFile(source, destination) {
  if (process.platform !== 'win32') {
    fs.renameSync(source, destination);
    syncDirectory(path.dirname(destination));
    return;
  }
  // Flags 0x1 | 0x8 are MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH.
  const command = `$ErrorActionPreference = 'Stop'\nAdd-Type -TypeDefinition @'\nusing System;\nusing System.Runtime.InteropServices;\npublic static class JosimiRelayDurableMove {\n  [DllImport("kernel32.dll", EntryPoint = "MoveFileExW", CharSet = CharSet.Unicode, SetLastError = true)]\n  public static extern bool MoveFileEx(string existingFileName, string newFileName, uint flags);\n}\n'@\nif (-not [JosimiRelayDurableMove]::MoveFileEx($env:JOSIMI_RELAY_TEMP, $env:JOSIMI_RELAY_TARGET, 9)) {\n  $code = [Runtime.InteropServices.Marshal]::GetLastWin32Error()\n  throw "MoveFileExW durable replacement failed with Win32 error $code"\n}`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    env: { ...process.env, JOSIMI_RELAY_TEMP: source, JOSIMI_RELAY_TARGET: destination },
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15_000,
    maxBuffer: 16 * 1024
  });
  if (result.error || result.status !== 0) {
    const reason = result.error?.message || String(result.stderr || '').trim() || `exit code ${result.status}`;
    throw new Error(`Relay recovery durable file replacement failed; transaction relay is blocked. (${reason})`);
  }
}

function atomicWrite(filePath, content) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const backupPath = `${filePath}.bak`;
  const fd = fs.openSync(tempPath, 'w', 0o600);
  try { fs.writeFileSync(fd, content, 'utf8'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  try {
    durableMoveFile(tempPath, filePath);
  } catch (error) {
    if (!fs.existsSync(filePath) || !['EEXIST', 'EPERM', 'EACCES'].includes(error.code)) {
      try { fs.rmSync(tempPath, { force: true }); } catch (_) {}
      throw error;
    }
    try {
      fs.rmSync(backupPath, { force: true });
      durableMoveFile(filePath, backupPath);
      durableMoveFile(tempPath, filePath);
      fs.rmSync(backupPath, { force: true });
    } catch (replaceError) {
      if (!fs.existsSync(filePath) && fs.existsSync(backupPath)) {
        try { durableMoveFile(backupPath, filePath); } catch (_) {}
      }
      try { fs.rmSync(tempPath, { force: true }); } catch (_) {}
      throw replaceError;
    }
  }
}

class RelayGuardStore {
  constructor(filePath) {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new TypeError('RelayGuardStore requires a file path.');
    this.filePath = path.resolve(filePath);
    this.backupPath = `${this.filePath}.bak`;
  }

  _read() {
    let source = this.filePath;
    if (!fs.existsSync(source) && fs.existsSync(this.backupPath)) source = this.backupPath;
    if (!fs.existsSync(source)) return { version: STORE_VERSION, records: {} };
    let parsed;
    try { parsed = JSON.parse(fs.readFileSync(source, 'utf8')); }
    catch (error) { throw new Error(`Relay recovery record is unreadable; new sends are blocked. (${error.message})`); }
    if (!parsed || parsed.version !== STORE_VERSION || !parsed.records || typeof parsed.records !== 'object' || Array.isArray(parsed.records)) {
      throw new Error('Relay recovery record has an unsupported format; new sends are blocked.');
    }
    const records = {};
    for (const [key, record] of Object.entries(parsed.records)) {
      if (!validateRecord(record) || key !== record.walletId) throw new Error('Relay recovery record failed validation; new sends are blocked.');
      records[key] = record;
    }
    return { version: STORE_VERSION, records };
  }

  get(walletPath) {
    const store = this._read();
    return store.records[walletKey(walletPath)] || null;
  }

  save(walletPath, record) {
    const walletId = walletKey(walletPath);
    if (!record || typeof record !== 'object' || Array.isArray(record) || Object.keys(record).some((key) => !SAFE_RECORD_FIELDS.has(key))) {
      throw new TypeError('Relay recovery record contains unsupported fields.');
    }
    const safeRecord = {
      walletId,
      pendingId: record.pendingId,
      state: record.state,
      txHashes: Array.isArray(record.txHashes) ? [...record.txHashes] : record.txHashes,
      createdAt: record.createdAt
    };
    if (!validateRecord(safeRecord)) throw new TypeError('Invalid relay recovery record.');
    const store = this._read();
    store.records[walletId] = safeRecord;
    const entries = Object.entries(store.records);
    if (entries.length > MAX_RECORDS) throw new Error('Too many unresolved relay recovery records; review and clear an existing record before sending.');
    atomicWrite(this.filePath, JSON.stringify(store));
    return store.records[walletId];
  }

  clear(walletPath, pendingId) {
    const store = this._read();
    const walletId = walletKey(walletPath);
    const record = store.records[walletId];
    if (!record || record.pendingId !== pendingId) return false;
    delete store.records[walletId];
    atomicWrite(this.filePath, JSON.stringify(store));
    return true;
  }
}

module.exports = { RelayGuardStore, walletKey, validateRecord };
