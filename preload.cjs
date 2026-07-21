// Exposes secure desktop IPC APIs to the renderer window
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true
});
