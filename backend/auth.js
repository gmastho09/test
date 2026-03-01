const fs = require('node:fs/promises');
const path = require('node:path');

const TOKEN_PATH = path.join(__dirname, 'token.json');

async function loadStoredToken() {
  try {
    const raw = await fs.readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveToken(token) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2), 'utf-8');
}

function buildScopes() {
  return [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ];
}

function applyToken(spotifyApi, token) {
  spotifyApi.setAccessToken(token.accessToken);
  spotifyApi.setRefreshToken(token.refreshToken);
  spotifyApi.setExpirationTime(token.expiresAt);
}

async function ensureFreshToken(spotifyApi, logger) {
  if (!spotifyApi.getRefreshToken()) {
    return false;
  }

  const expiresAt = spotifyApi.getExpirationTime() || 0;
  const shouldRefresh = Date.now() >= expiresAt - 30_000;
  if (!shouldRefresh) {
    return true;
  }

  try {
    const refreshed = await spotifyApi.refreshAccessToken();
    const token = {
      accessToken: refreshed.body.access_token,
      refreshToken: refreshed.body.refresh_token || spotifyApi.getRefreshToken(),
      expiresAt: Date.now() + refreshed.body.expires_in * 1000
    };

    applyToken(spotifyApi, token);
    await saveToken(token);
    logger('Token Spotify rafraîchi automatiquement.');
    return true;
  } catch (error) {
    logger(`Échec du refresh token: ${error.message}`);
    return false;
  }
}

module.exports = {
  buildScopes,
  loadStoredToken,
  saveToken,
  applyToken,
  ensureFreshToken
};
