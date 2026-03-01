const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('node:path');

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8787';

function createWindow() {
  const win = new BrowserWindow({
    width: 380,
    height: 160,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('open-external', async (_event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('get-config', () => ({ backendUrl: BACKEND_URL }));

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
