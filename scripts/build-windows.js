'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');
const { prepare } = require('./prepare-monero-runtime');
const { cleanup } = require('./cleanup-monero-runtime');

const ROOT = path.join(__dirname, '..');

async function runWithCleanup(prepareRuntime, build, cleanupRuntime) {
  let failure = null;
  try {
    await prepareRuntime();
    await build();
  } catch (error) {
    failure = error;
  } finally {
    try { await cleanupRuntime(); }
    catch (error) { if (!failure) failure = error; }
  }
  if (failure) throw failure;
}

function runElectronBuilder() {
  return new Promise((resolve, reject) => {
    const executable = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder');
    const child = spawn(executable, ['--win', 'zip'], {
      cwd: ROOT,
      stdio: 'inherit',
      ...(process.platform === 'win32' ? { shell: true } : {})
    });
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      error ? reject(error) : resolve();
    };
    child.once('error', finish);
    child.once('close', (code, signal) => {
      if (code === 0) finish();
      else finish(new Error(`electron-builder failed (code ${code ?? 'none'}, signal ${signal || 'none'}).`));
    });
  });
}

if (require.main === module) {
  runWithCleanup(prepare, runElectronBuilder, cleanup).catch((error) => {
    console.error(`Windows packaging failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { runWithCleanup };
