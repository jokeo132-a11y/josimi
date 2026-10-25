'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('mining privacy notice is linked in the UI and translated in all supported languages', () => {
  const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
  const renderer = fs.readFileSync(path.join(root, 'src/renderer.js'), 'utf8');
  assert.match(html, /data-i18n="miningPrivacyNotice"/);
  for (const locale of ['ko', 'en', 'zh', 'ja']) {
    assert.match(renderer, new RegExp(`\\b${locale}: \\{[^\\n]*miningPrivacyNotice:`));
    assert.match(renderer, new RegExp(`\\b${locale}: \\{[^\\n]*miningPrivacyNotice:[^\\n]*P2Pool`));
  }
});

test('privacy docs disclose pre-open node contact and the P2Pool address behavior', () => {
  const privacy = fs.readFileSync(path.join(root, 'PRIVACY.md'), 'utf8');
  const release = fs.readFileSync(path.join(root, '.github/workflows/release.yml'), 'utf8');
  assert.match(privacy, /Creating a wallet can contact the selected daemon before the wallet opens/);
  assert.match(privacy, /In P2Pool mode, josimi passes the remote endpoint and optional TLS setting to XMRig but does not pass the wallet address/);
  assert.match(release, /persist-credentials:\s*false/);
});

test('privacy and release verification docs disclose fees, audit limits, and checksum caveats', () => {
  const privacy = fs.readFileSync(path.join(root, 'PRIVACY.md'), 'utf8');
  const security = fs.readFileSync(path.join(root, 'SECURITY.md'), 'utf8');
  const verify = fs.readFileSync(path.join(root, 'VERIFY_RELEASE.md'), 'utf8');
  assert.match(privacy, /0\.25%/);
  assert.match(privacy, /0\.05 XMR/);
  assert.match(security, /independent security audit/i);
  assert.match(verify, /does not prove/i);
});
