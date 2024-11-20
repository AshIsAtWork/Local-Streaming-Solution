const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const WebSocket = require('ws'); // Add WebSocket library
const path = require('path');

let mainWindow;
let wsServer;

// Create a WebSocket server
function createWebSocketServer() {
  wsServer = new WebSocket.Server({ port: 8080 });
  console.log('WebSocket server started on ws://localhost:8080');

  wsServer.on('connection', (ws) => {
    ws.on('message', (message, isBinary) => {
      wsServer.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message, { binary: isBinary });
        }
      })
    })
  });
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  // Create the main Electron window
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script for secure IPC
      contextIsolation: true, // Secure context
      nodeIntegration: false, // No direct Node.js integration in the renderer
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Start the WebSocket server
  createWebSocketServer();

  // Handle screen capture requests from the renderer process
  ipcMain.on('start-stream', async (event) => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });

    if (sources.length > 0) {
      const screenStream = sources[0];

      // Notify the renderer process of the selected source
      event.sender.send('screen-source-selected', screenStream.id);
    } else {
      console.log('No sources available for screen capture.');
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
