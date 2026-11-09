'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installPermissionPolicy } = require('../src/permission-policy');

const APP_URL = 'file:///opt/josimi/src/index.html';

function createSession() {
  return {
    setPermissionRequestHandler(handler) { this.requestHandler = handler; },
    setPermissionCheckHandler(handler) { this.checkHandler = handler; }
  };
}

function createWebContents(url = APP_URL) {
  return { getURL: () => url };
}

test('Electron permission policy allows only sanitized clipboard writes from the exact app page', () => {
  const session = createSession();
  const appContents = createWebContents();
  installPermissionPolicy(session, APP_URL);

  let granted;
  session.requestHandler(appContents, 'clipboard-sanitized-write', (value) => { granted = value; }, { requestingUrl: APP_URL });
  assert.equal(granted, true);

  for (const permission of ['clipboard-read', 'media', 'notifications', 'geolocation', 'fullscreen', 'unknown']) {
    session.requestHandler(appContents, permission, (value) => { granted = value; }, { requestingUrl: APP_URL });
    assert.equal(granted, false, `${permission} must be denied`);
  }

  session.requestHandler(appContents, 'clipboard-sanitized-write', (value) => { granted = value; }, { requestingUrl: 'https://attacker.example/' });
  assert.equal(granted, false, 'a mismatched requesting URL must be denied');
  session.requestHandler(createWebContents('https://attacker.example/'), 'clipboard-sanitized-write', (value) => { granted = value; }, { requestingUrl: APP_URL });
  assert.equal(granted, false, 'a non-app webContents must be denied');
});

test('Electron permission checks use the same default-deny allowlist', () => {
  const session = createSession();
  const appContents = createWebContents();
  installPermissionPolicy(session, APP_URL);

  assert.equal(session.checkHandler(appContents, 'clipboard-sanitized-write', 'file://', { requestingUrl: APP_URL }), true);
  assert.equal(session.checkHandler(appContents, 'clipboard-read', 'file://', { requestingUrl: APP_URL }), false);
  assert.equal(session.checkHandler(appContents, 'clipboard-sanitized-write', 'https://attacker.example', { requestingUrl: 'https://attacker.example/' }), false);
  assert.equal(session.checkHandler(null, 'clipboard-sanitized-write', 'file://', { requestingUrl: APP_URL }), false);
});
