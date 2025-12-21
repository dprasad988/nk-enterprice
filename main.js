const { app, BrowserWindow } = require('electron');
const path = require('path');


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // For simple prototype; use preload in prod
    },
    backgroundColor: '#121212', // Dark mode background to prevent white flash
    title: 'Hardware POS'
  });

  // In development, load from Vite server
  mainWindow.loadURL('http://localhost:5173').catch((e) => {
    console.log('Failed to load Vite server, falling back to file:', e);
    mainWindow.loadFile('index.html');
  });

  // Open DevTools for debugging
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
