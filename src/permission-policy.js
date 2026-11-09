'use strict';

const CLIPBOARD_WRITE_PERMISSION = 'clipboard-sanitized-write';

function isAllowedRequest(webContents, permission, details, appUrl) {
  if (permission !== CLIPBOARD_WRITE_PERMISSION) return false;
  if (!webContents || typeof webContents.getURL !== 'function') return false;
  if (webContents.getURL() !== appUrl) return false;
  const requestingUrl = details?.requestingUrl;
  return requestingUrl == null || requestingUrl === appUrl;
}

function installPermissionPolicy(session, appUrl) {
  if (!session || typeof session.setPermissionRequestHandler !== 'function' || typeof session.setPermissionCheckHandler !== 'function') {
    throw new TypeError('A valid Electron session is required.');
  }
  if (typeof appUrl !== 'string' || !appUrl.startsWith('file:')) {
    throw new TypeError('The local app file URL is required.');
  }

  session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (typeof callback !== 'function') return;
    callback(isAllowedRequest(webContents, permission, details, appUrl));
  });
  session.setPermissionCheckHandler((webContents, permission, _requestingOrigin, details) =>
    isAllowedRequest(webContents, permission, details, appUrl));
}

module.exports = { installPermissionPolicy };
