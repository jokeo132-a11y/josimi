'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const https = require('node:https');
const { execFile, spawn } = require('node:child_process');
const { promisify } = require('node:util');
const { MONERO_VERSION, MONERO_ARCHIVE_URL, MONERO_ARCHIVE_SHA256, MAX_ARCHIVE_BYTES, MONERO_MANIFEST, MONERO_DAEMON, isAllowedRuntimeName, sha256File } = require('../src/node-manager');

const execFileAsync = promisify(execFile);
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'runtime', 'monero');
const LICENSE_SOURCE = path.join(ROOT, 'licenses', 'monero', 'LICENSE.txt');
const NOTICE_SOURCE = path.join(ROOT, 'licenses', 'monero', 'UPSTREAM-NOTICE.txt');
const MAX_REDIRECTS = 4;
const IDLE_TIMEOUT_MS = 30_000;
const TOTAL_TIMEOUT_MS = 15 * 60 * 1000;

function isSafeArchiveEntry(member) {
  if (typeof member !== 'string' || member.length === 0 || member.length > 2048 || /[\0\x01-\x1f\x7f]/.test(member)) return false;
  const normalized = member.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized) || normalized.startsWith('//')) return false;
  const parts = normalized.split('/').filter(Boolean);
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) return false;
  return parts.every((part) => !/[<>:"|?*]/.test(part) && !/[. ]$/.test(part) && !/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i.test(part));
}

function downloadOfficialArchive(url, destination, redirects = 0) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let request;
    let response;
    let output;
    let received = 0;
    const hash = crypto.createHash('sha256');
    let totalTimer;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(totalTimer);
      error ? reject(error) : resolve(result);
    };
    const fail = (error) => {
      if (response && !response.destroyed) response.destroy();
      if (request && !request.destroyed) request.destroy();
      if (output && !output.closed) {
        output.once('close', () => finish(error));
        output.destroy();
      } else finish(error);
    };

    let parsed;
    try { parsed = new URL(url); } catch (_) { return finish(new Error('Invalid official Monero archive URL.')); }
    if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'downloads.getmonero.org' || parsed.username || parsed.password) {
      return finish(new Error('Blocked non-official Monero archive URL.'));
    }
    if (redirects > MAX_REDIRECTS) return finish(new Error('Too many redirects from the official Monero download host.'));

    request = https.get(parsed, { headers: { 'User-Agent': 'josimi-release-builder' } }, (incoming) => {
      response = incoming;
      if ([301, 302, 303, 307, 308].includes(incoming.statusCode)) {
        const location = incoming.headers.location;
        incoming.resume();
        if (!location) return finish(new Error('Official Monero download redirect omitted its Location header.'));
        let next;
        try { next = new URL(location, parsed); } catch (_) { return finish(new Error('Malformed redirect URL from the official Monero download host.')); }
        if (next.protocol !== 'https:' || next.hostname.toLowerCase() !== 'downloads.getmonero.org' || next.username || next.password) {
          return finish(new Error('Blocked an unexpected redirect from the official Monero download host.'));
        }
        return downloadOfficialArchive(next.toString(), destination, redirects + 1).then((result) => finish(null, result), finish);
      }
      if (incoming.statusCode !== 200) {
        incoming.resume();
        return finish(new Error(`Official Monero archive download returned HTTP ${incoming.statusCode}.`));
      }
      const declaredLength = Number(incoming.headers['content-length'] || 0);
      if (declaredLength > MAX_ARCHIVE_BYTES) return fail(new Error('Official Monero archive exceeds the configured size limit.'));
      output = require('node:fs').createWriteStream(destination, { flags: 'wx' });
      incoming.on('data', (chunk) => {
        received += chunk.length;
        if (received > MAX_ARCHIVE_BYTES) return fail(new Error('Official Monero archive exceeds the configured size limit.'));
        hash.update(chunk);
      });
      incoming.once('error', fail);
      output.once('error', fail);
      output.once('finish', () => output.close((error) => {
        if (error) return fail(error);
        if (declaredLength && received !== declaredLength) return finish(new Error('Downloaded Monero archive size does not match the server declaration.'));
        finish(null, { bytes: received, sha256: hash.digest('hex') });
      }));
      incoming.pipe(output);
    });
    totalTimer = setTimeout(() => request.destroy(new Error('Official Monero archive download exceeded 15 minutes.')), TOTAL_TIMEOUT_MS);
    request.setTimeout(IDLE_TIMEOUT_MS, () => request.destroy(new Error('Official Monero archive connection was idle for 30 seconds.')));
    request.once('error', fail);
  });
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function extractArchive(archivePath, destination) {
  if (process.platform === 'win32') {
    const command = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive=[System.IO.Compression.ZipFile]::OpenRead(${quotePowerShell(archivePath)}); $unsafe=$false; try { foreach($entry in $archive.Entries) { $member=$entry.FullName.Replace('\\','/'); $parts=@($member.Split('/') | Where-Object { $_ -ne '' }); if([IO.Path]::IsPathRooted($member) -or $member.StartsWith('/') -or $member -match '^[A-Za-z]:' -or ($parts -contains '..') -or ($parts -contains '.')) { $unsafe=$true; break }; foreach($part in $parts) { if($part -match '[<>:"|?*]' -or $part -match '[. ]$' -or $part -match '^(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\\..*)?$') { $unsafe=$true; break } }; if($unsafe) { break } } } finally { $archive.Dispose() }; if($unsafe) { exit 42 }; Expand-Archive -LiteralPath ${quotePowerShell(archivePath)} -DestinationPath ${quotePowerShell(destination)} -Force`;
    await new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, stdio: 'ignore' });
      child.once('error', reject);
      child.once('close', (code) => {
        if (code === 0) return resolve();
        if (code === 42) return reject(new Error('Official Monero archive contains an unsafe ZIP member path.'));
        reject(new Error(`PowerShell Monero archive extraction failed with code ${code}.`));
      });
    });
    return;
  }
  const listed = await execFileAsync('unzip', ['-Z1', archivePath], { maxBuffer: 8 * 1024 * 1024 });
  const members = listed.stdout.split(/\r?\n/).filter(Boolean);
  if (!members.length || members.some((member) => !isSafeArchiveEntry(member))) throw new Error('Official Monero archive contains an unsafe ZIP member path.');
  await execFileAsync('unzip', ['-q', archivePath, '-d', destination], { maxBuffer: 1024 * 1024 });
}

async function findFiles(root, fileName) {
  const found = [];
  async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Monero archive extraction produced a symbolic link; refusing to stage it.');
      if (entry.isDirectory()) await visit(candidate);
      else if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) found.push(candidate);
    }
  }
  await visit(root);
  return found;
}

async function stageArchive(archivePath, outputDir = OUTPUT_DIR, sourceArchiveSha256 = MONERO_ARCHIVE_SHA256) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-monero-stage-'));
  const extractedDir = path.join(workDir, 'extracted');
  await fs.mkdir(extractedDir, { recursive: true });
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  try {
    await extractArchive(archivePath, extractedDir);
    const daemonFiles = await findFiles(extractedDir, MONERO_DAEMON);
    if (daemonFiles.length !== 1) throw new Error(`Expected exactly one ${MONERO_DAEMON} in the official Monero archive; found ${daemonFiles.length}.`);
    const daemonSource = daemonFiles[0];
    const sourceDir = path.dirname(daemonSource);
    const sourceEntries = await fs.readdir(sourceDir, { withFileTypes: true });
    const selected = [daemonSource];
    for (const entry of sourceEntries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.dll')) selected.push(path.join(sourceDir, entry.name));
    }
    const names = new Set();
    for (const source of selected) {
      const name = source === daemonSource ? MONERO_DAEMON : path.basename(source);
      if (!isAllowedRuntimeName(name) || names.has(name)) throw new Error(`Unsafe or duplicate Monero runtime filename: ${name}`);
      names.add(name);
      const stat = await fs.lstat(source);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Monero runtime component is not a regular file: ${name}`);
      await fs.copyFile(source, path.join(outputDir, name));
    }
    for (const [source, name] of [[LICENSE_SOURCE, 'MONERO-LICENSE.txt'], [NOTICE_SOURCE, 'UPSTREAM-NOTICE.txt']]) {
      const target = path.join(outputDir, name);
      await fs.copyFile(source, target);
      names.add(name);
    }
    if (!names.has(MONERO_DAEMON)) throw new Error('The staged Monero runtime does not contain monerod.exe.');
    const files = [];
    for (const name of [...names].sort()) files.push({ name, sha256: await sha256File(path.join(outputDir, name)) });
    const manifest = { schemaVersion: 1, project: 'monero-project/monero', version: MONERO_VERSION, sourceArchive: path.basename(archivePath), sourceArchiveSha256, files };
    await fs.writeFile(path.join(outputDir, MONERO_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    return { outputDir, files, manifest };
  } catch (error) {
    await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

async function stagedRuntimeValid() {
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, MONERO_MANIFEST), 'utf8'));
    if (manifest.version !== MONERO_VERSION || manifest.sourceArchiveSha256 !== MONERO_ARCHIVE_SHA256 || !Array.isArray(manifest.files)) return false;
    const names = new Set();
    for (const file of manifest.files) {
      if (!file || !isAllowedRuntimeName(file.name) || !/^[a-f0-9]{64}$/.test(file.sha256) || names.has(file.name)) return false;
      names.add(file.name);
      if (await sha256File(path.join(OUTPUT_DIR, file.name)) !== file.sha256) return false;
    }
    if (!names.has(MONERO_DAEMON)) return false;
    const actual = (await fs.readdir(OUTPUT_DIR)).sort();
    const expected = [...names, MONERO_MANIFEST].sort();
    return actual.length === expected.length && actual.every((name, index) => name === expected[index]);
  } catch (_) { return false; }
}

async function prepare() {
  if (await stagedRuntimeValid()) {
    console.log(`Using verified monerod-only runtime v${MONERO_VERSION}; no other Monero CLI executables are staged.`);
    return OUTPUT_DIR;
  }
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'josimi-monero-download-'));
  const archivePath = path.join(tempDir, `monero-win-x64-v${MONERO_VERSION}.zip`);
  try {
    const result = await downloadOfficialArchive(MONERO_ARCHIVE_URL, archivePath);
    if (result.sha256 !== MONERO_ARCHIVE_SHA256) throw new Error(`Monero archive SHA-256 mismatch: expected ${MONERO_ARCHIVE_SHA256}, received ${result.sha256}. Refusing to stage it.`);
    const staged = await stageArchive(archivePath, OUTPUT_DIR, result.sha256);
    console.log(`Staged monerod.exe and ${staged.files.length - 3} runtime DLL(s); source archive SHA-256 verified (${result.bytes} bytes).`);
    return OUTPUT_DIR;
  } catch (error) {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true }).catch(() => {});
    throw error;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  prepare().catch((error) => {
    console.error(`Could not stage the official Monero daemon runtime: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { OUTPUT_DIR, isSafeArchiveEntry, extractArchive, stageArchive, stagedRuntimeValid, prepare };
