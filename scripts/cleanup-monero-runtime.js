'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

async function cleanup() {
  const directory = path.join(__dirname, '..', 'assets', 'runtime', 'monero');
  await fs.rm(directory, { recursive: true, force: true });
}

if (require.main === module) {
  cleanup().catch((error) => {
    console.error(`Could not clean generated Monero runtime staging files: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { cleanup };
