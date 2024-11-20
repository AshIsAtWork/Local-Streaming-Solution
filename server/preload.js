const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startStream: () => ipcRenderer.send('start-stream'),
  onScreenSourceSelected: (callback) =>
    ipcRenderer.on('screen-source-selected', (event, sourceId) => callback(sourceId)),
});
