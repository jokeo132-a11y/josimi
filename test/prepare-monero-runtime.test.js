'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  MONERO_VERSION,
  MONERO_ARCHIVE_SHA256,
  MONERO_MANIFEST,
  LocalNodeManager
} = require('../src/node-manager');
const { isSafeArchiveEntry, stageArchive } = require('../scripts/prepare-monero-runtime');

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let k = 0; k < 8; k += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

async function writeZip(filePath, entries) {
  const localRecords = [];
  const centralRecords = [];
  let offset = 0;
  for (const [entryName, content] of entries) {
    const name = Buffer.from(entryName, 'utf8');
    const data = Buffer.from(content);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localRecords.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralRecords.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const centralData = Buffer.concat(centralRecords);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralData.length, 12);
  end.writeUInt32LE(offset, 16);
  await fs.writeFile(filePath, Buffer.concat([...localRecords, centralData, end]));
}

test('ZIP path validator rejects traversal, absolute paths, Windows devices, and invalid names', () => {
  for (const unsafe of ['../escape.exe', 'folder/../../escape.exe', '/rooted.exe', 'C:/drive.exe', 'folder\\..\\escape.exe', 'CON.dll', 'name.', 'bad?.dll']) {
    assert.equal(isSafeArchiveEntry(unsafe), false, unsafe);
  }
  for (const safe of ['monero/monerod.exe', 'monero/libwallet.dll', 'monero/README.txt']) {
    assert.equal(isSafeArchiveEntry(safe), true, safe);
  }
});

test('staging keeps only monerod, its same-directory DLLs, and upstream notices', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-stage-runtime-'));
  const archivePath = path.join(root, 'monero.zip');
  const outputDir = path.join(root, 'runtime');
  const packageDir = `monero-win-x64-v${MONERO_VERSION}`;
  await writeZip(archivePath, [
    [`${packageDir}/monerod.exe`, 'official-daemon-placeholder'],
    [`${packageDir}/libwallet.dll`, 'required-dll-placeholder'],
    [`${packageDir}/monero-wallet-cli.exe`, 'other-cli-placeholder'],
    ['other-tools/unused.dll', 'not-a-monero-runtime-dll']
  ]);
  try {
    const staged = await stageArchive(archivePath, outputDir, MONERO_ARCHIVE_SHA256);
    const actual = (await fs.readdir(outputDir)).sort();
    assert.deepEqual(actual, ['MONERO-LICENSE.txt', 'UPSTREAM-NOTICE.txt', 'libwallet.dll', 'manifest.json', 'monerod.exe'].sort());
    assert.equal(staged.manifest.version, MONERO_VERSION);
    assert.equal(staged.manifest.sourceArchiveSha256, MONERO_ARCHIVE_SHA256);
    assert.equal(staged.manifest.files.length, 4);
    assert.equal(await fs.readFile(path.join(outputDir, 'monerod.exe'), 'utf8'), 'official-daemon-placeholder');
    assert.equal(await fs.access(path.join(outputDir, 'monero-wallet-cli.exe')).then(() => true, () => false), false);
    assert.equal(await fs.access(path.join(outputDir, 'monero.zip')).then(() => true, () => false), false);
    const manager = new LocalNodeManager({ root: path.join(root, 'user-data'), platform: 'win32', bundledRuntimeDir: outputDir });
    assert.equal((await manager.install()).installed, true);
    assert.equal(await fs.access(path.join(outputDir, MONERO_MANIFEST)).then(() => true, () => false), true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('staging rejects ZIP traversal before extracting archive members', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-stage-unsafe-'));
  const archivePath = path.join(root, 'unsafe.zip');
  const outputDir = path.join(root, 'runtime');
  await writeZip(archivePath, [['../outside.exe', 'unsafe'], ['monerod.exe', 'daemon']]);
  try {
    await assert.rejects(stageArchive(archivePath, outputDir), /unsafe ZIP member path/i);
    assert.equal(await fs.access(outputDir).then(() => true, () => false), false);
    assert.equal(await fs.access(path.join(root, 'outside.exe')).then(() => true, () => false), false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
