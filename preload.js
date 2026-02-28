const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spotifyBridge', {
  openAuth: () => ipcRenderer.invoke('spotify:get-auth-url'),
  authCallback: (code) => ipcRenderer.invoke('spotify:auth-callback', code),
  getCurrent: () => ipcRenderer.invoke('spotify:get-current'),
  playPause: (shouldPlay) => ipcRenderer.invoke('spotify:play-pause', shouldPlay),
  next: () => ipcRenderer.invoke('spotify:next'),
  previous: () => ipcRenderer.invoke('spotify:previous')
});
