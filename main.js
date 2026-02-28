const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const {
  createAuthUrl,
  exchangeCodeForToken,
  getCurrentlyPlaying,
  play,
  pause,
  nextTrack,
  previousTrack
} = require('./spotify');

let mainWindow;
let accessToken = null;
let refreshToken = null;
let tokenExpiresAt = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 700,
    minWidth: 420,
    minHeight: 650,
    autoHideMenuBar: true,
    backgroundColor: '#f7e7ce',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

async function ensureToken() {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return accessToken;
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

ipcMain.handle('spotify:get-auth-url', async () => {
  const url = createAuthUrl();
  await shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle('spotify:auth-callback', async (_, code) => {
  try {
    const tokenResponse = await exchangeCodeForToken(code);
    accessToken = tokenResponse.access_token;
    refreshToken = tokenResponse.refresh_token;
    tokenExpiresAt = Date.now() + (tokenResponse.expires_in - 30) * 1000;

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('spotify:get-current', async () => {
  try {
    const token = await ensureToken();
    const data = await getCurrentlyPlaying(token);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('spotify:play-pause', async (_, shouldPlay) => {
  try {
    const token = await ensureToken();
    if (shouldPlay) {
      await play(token);
    } else {
      await pause(token);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('spotify:next', async () => {
  try {
    const token = await ensureToken();
    await nextTrack(token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('spotify:previous', async () => {
  try {
    const token = await ensureToken();
    await previousTrack(token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
