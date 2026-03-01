require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');

const { createSpotifyClient, getCurrentPlayback, playPause } = require('./spotify');
const { buildScopes, loadStoredToken, saveToken, applyToken, ensureFreshToken } = require('./auth');

const PORT = Number(process.env.BACKEND_PORT || 8787);
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `http://127.0.0.1:${PORT}/auth/callback`;

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logFile = path.join(logsDir, 'backend.log');

function logger(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  fs.appendFileSync(logFile, `${line}\n`);
  console.log(line);
}

const app = express();
app.use(cors());
app.use(express.json());

const spotifyApi = createSpotifyClient({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI
});

let authReady = false;

(async () => {
  const stored = await loadStoredToken();
  if (stored) {
    applyToken(spotifyApi, stored);
    authReady = true;
    logger('Token Spotify restauré depuis le stockage local.');
  }
})();

function requireSpotifyConfig(req, res, next) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Spotify credentials missing',
      details: 'Configurez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET dans un fichier .env.'
    });
  }

  return next();
}

async function requireAuth(req, res, next) {
  if (!authReady) {
    return res.status(401).json({
      error: 'Not authenticated',
      loginUrl: '/auth/login'
    });
  }

  const ok = await ensureFreshToken(spotifyApi, logger);
  if (!ok) {
    authReady = false;
    return res.status(401).json({
      error: 'Token expired',
      loginUrl: '/auth/login'
    });
  }

  return next();
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', authReady });
});

app.get('/auth/login', requireSpotifyConfig, (_req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(buildScopes(), 'spotify-mini-player-state', true);
  logger('Auth demandée: ouverture du flux OAuth Spotify.');
  res.json({ authorizeURL });
});

app.get('/auth/callback', requireSpotifyConfig, async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Code OAuth manquant.');
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const token = {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresAt: Date.now() + data.body.expires_in * 1000
    };

    applyToken(spotifyApi, token);
    await saveToken(token);
    authReady = true;
    logger('Authentification Spotify réussie.');

    return res.send('Spotify connecté. Vous pouvez revenir à l\'application.');
  } catch (error) {
    logger(`Erreur auth callback: ${error.message}`);
    return res.status(500).send('Erreur lors de l\'authentification Spotify.');
  }
});

app.get('/api/player/current', requireSpotifyConfig, requireAuth, async (_req, res) => {
  try {
    const playback = await getCurrentPlayback(spotifyApi);
    res.json(playback);
  } catch (error) {
    logger(`Erreur current playback: ${error.message}`);
    res.status(500).json({ error: 'Unable to fetch playback state' });
  }
});

app.post('/api/player/play-pause', requireSpotifyConfig, requireAuth, async (_req, res) => {
  try {
    const result = await playPause(spotifyApi);
    res.json(result);
  } catch (error) {
    logger(`Erreur play/pause: ${error.message}`);
    res.status(500).json({ error: 'Unable to toggle playback' });
  }
});

app.post('/api/player/next', requireSpotifyConfig, requireAuth, async (_req, res) => {
  try {
    await spotifyApi.skipToNext();
    res.json({ action: 'next' });
  } catch (error) {
    logger(`Erreur next: ${error.message}`);
    res.status(500).json({ error: 'Unable to skip to next track' });
  }
});

app.post('/api/player/previous', requireSpotifyConfig, requireAuth, async (_req, res) => {
  try {
    await spotifyApi.skipToPrevious();
    res.json({ action: 'previous' });
  } catch (error) {
    logger(`Erreur previous: ${error.message}`);
    res.status(500).json({ error: 'Unable to skip to previous track' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  logger(`Backend API démarrée sur http://127.0.0.1:${PORT}`);
});
