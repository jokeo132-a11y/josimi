'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { Readable } = require('node:stream');
const asar = require('@electron/asar');
const { MONERO_VERSION, MONERO_ARCHIVE_SHA256 } = require('../src/node-manager');

const ROOT = path.join(__dirname, '..');
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
const VERIFIER = path.join(ROOT, 'scripts', 'verify-release-bundle.py');

async function makeReleaseZip({ unpackRuntime = true, extraAsarFiles = [], extraZipFiles = [] } = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-release-verifier-test-'));
  const packageRoot = path.join(tempDir, 'package');
  const runtimeDir = path.join(packageRoot, 'resources', 'app.asar.unpacked', 'assets', 'runtime', 'monero');
  const asarPath = path.join(packageRoot, 'resources', 'app.asar');
  await fs.mkdir(runtimeDir, { recursive: true });

  const runtimeFiles = [
    ['monerod.exe', Buffer.from('synthetic monerod runtime')],
    ['MONERO-LICENSE.txt', Buffer.from('synthetic Monero license')],
    ['UPSTREAM-NOTICE.txt', Buffer.from('synthetic upstream notice')]
  ];
  const manifest = {
    schemaVersion: 1,
    project: 'monero-project/monero',
    version: MONERO_VERSION,
    sourceArchive: `monero-win-x64-v${MONERO_VERSION}.zip`,
    sourceArchiveSha256: MONERO_ARCHIVE_SHA256,
    files: runtimeFiles.map(([name, data]) => ({
      name,
      sha256: crypto.createHash('sha256').update(data).digest('hex')
    }))
  };
  const manifestData = Buffer.from(JSON.stringify(manifest));
  const packagedRuntimeFiles = [...runtimeFiles, ['manifest.json', manifestData]];
  for (const [name, data] of packagedRuntimeFiles) {
    await fs.writeFile(path.join(runtimeDir, name), data);
  }

  const appSource = Buffer.from('synthetic application entry');
  const streamEntry = (filePath, data, unpacked) => ({
    path: filePath,
    type: 'file',
    unpacked,
    stat: { mode: 0o644, size: data.length },
    streamGenerator: () => Readable.from([data])
  });
  const streams = [streamEntry('main.js', appSource, false)];
  for (const [name, data] of packagedRuntimeFiles) {
    streams.push(streamEntry(`assets/runtime/monero/${name}`, data, unpackRuntime));
  }
  for (const item of extraAsarFiles) {
    streams.push(streamEntry(item.path, Buffer.from(item.content || 'unexpected executable'), Boolean(item.unpacked)));
  }
  await asar.createPackageFromStreams(asarPath, streams);

  for (const item of extraZipFiles) {
    const target = path.join(packageRoot, ...item.path.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, item.content || 'unexpected mining component');
  }

  const zipPath = path.join(tempDir, `josimi-${MONERO_VERSION}-x64.zip`);
  const zipScript = [
    'import os, sys, zipfile',
    'root, output = sys.argv[1:]',
    'with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:',
    '    for base, dirs, files in os.walk(root):',
    '        dirs.sort()',
    '        for name in sorted(files):',
    '            full = os.path.join(base, name)',
    '            archive.write(full, os.path.relpath(full, root).replace(os.sep, "/"))'
  ].join('\n');
  execFileSync(PYTHON, ['-c', zipScript, packageRoot, zipPath], { cwd: ROOT, stdio: 'pipe' });
  return { tempDir, zipPath };
}

function verify(zipPath) {
  return spawnSync(PYTHON, [VERIFIER, zipPath], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
}

test('release verifier accepts daemon files represented as unpacked ASAR entries', async () => {
  const fixture = await makeReleaseZip();
  try {
    const result = verify(fixture.zipPath);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /Verified monerod-only Monero/);
  } finally {
    await fs.rm(fixture.tempDir, { recursive: true, force: true });
  }
});

test('release verifier rejects a Monero runtime file embedded in app.asar', async () => {
  const fixture = await makeReleaseZip({ unpackRuntime: false });
  try {
    const result = verify(fixture.zipPath);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be files marked unpacked/);
  } finally {
    await fs.rm(fixture.tempDir, { recursive: true, force: true });
  }
});

test('release verifier rejects a Monero CLI executable hidden elsewhere in app.asar', async () => {
  const fixture = await makeReleaseZip({
    extraAsarFiles: [{ path: 'tools/monero-wallet-cli.exe', content: 'unapproved CLI executable' }]
  });
  try {
    const result = verify(fixture.zipPath);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /app\.asar unexpectedly contains a Monero CLI archive or executable/);
  } finally {
    await fs.rm(fixture.tempDir, { recursive: true, force: true });
  }
});

test('release verifier rejects mining runtimes hidden in app.asar', async () => {
  const fixture = await makeReleaseZip({
    extraAsarFiles: [{ path: 'assets/runtime/xmrig/xmrig.exe', content: 'unexpected miner' }]
  });
  try {
    const result = verify(fixture.zipPath);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /app\.asar unexpectedly contains a forbidden mining component/);
  } finally {
    await fs.rm(fixture.tempDir, { recursive: true, force: true });
  }
});

test('release verifier rejects mining binaries elsewhere in the outer ZIP', async () => {
  const fixture = await makeReleaseZip({
    extraZipFiles: [{ path: 'resources/app.asar.unpacked/assets/runtime/p2pool/p2pool.exe', content: 'unexpected miner' }]
  });
  try {
    const result = verify(fixture.zipPath);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Windows release ZIP contains a forbidden mining component/);
  } finally {
    await fs.rm(fixture.tempDir, { recursive: true, force: true });
  }
});
