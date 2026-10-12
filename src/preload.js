const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('monejo', {
  config: () => ipcRenderer.invoke('app-config'),
  create: (payload) => ipcRenderer.invoke('wallet-create', payload),
  restore: (payload) => ipcRenderer.invoke('wallet-restore', payload),
  open: (payload) => ipcRenderer.invoke('wallet-open', payload),
  refresh: () => ipcRenderer.invoke('wallet-refresh'),
  lock: () => ipcRenderer.invoke('wallet-lock'),
  previewSend: (payload) => ipcRenderer.invoke('wallet-send-preview', payload),
  send: (payload) => ipcRenderer.invoke('wallet-send', payload),
  exportBackup: () => ipcRenderer.invoke('wallet-export-backup'),
  qr: (text) => ipcRenderer.invoke('wallet-qr', text)
});
