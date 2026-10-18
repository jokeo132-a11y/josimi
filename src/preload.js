const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('josimi', {
  config: () => ipcRenderer.invoke('app-config'),
  create: (payload) => ipcRenderer.invoke('wallet-create', payload),
  restore: (payload) => ipcRenderer.invoke('wallet-restore', payload),
  open: (payload) => ipcRenderer.invoke('wallet-open', payload),
  refresh: () => ipcRenderer.invoke('wallet-refresh'),
  nodeStatus: () => ipcRenderer.invoke('node-status'),
  miningStatus: () => ipcRenderer.invoke('mining-status'),
  miningStart: (payload) => ipcRenderer.invoke('mining-start', payload),
  miningStop: () => ipcRenderer.invoke('mining-stop'),
  onNodeStatus: (callback) => ipcRenderer.on('node-status', (_, status) => callback(status)),
  onMiningStatus: (callback) => ipcRenderer.on('mining-status', (_, status) => callback(status)),
  lock: () => ipcRenderer.invoke('wallet-lock'),
  previewSend: (payload) => ipcRenderer.invoke('wallet-send-preview', payload),
  cancelSend: (payload) => ipcRenderer.invoke('wallet-send-cancel', payload),
  pendingSend: () => ipcRenderer.invoke('wallet-send-pending'),
  ackSend: (payload) => ipcRenderer.invoke('wallet-send-ack', payload),
  send: (payload) => ipcRenderer.invoke('wallet-send', payload),
  exportBackup: () => ipcRenderer.invoke('wallet-export-backup'),
  qr: (text) => ipcRenderer.invoke('wallet-qr', text)
});
