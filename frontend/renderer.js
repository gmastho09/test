const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const stateEl = document.getElementById('state');
const statusEl = document.getElementById('status');
const coverEl = document.getElementById('cover');

const btnConnect = document.getElementById('connect');
const btnPrev = document.getElementById('prev');
const btnPlayPause = document.getElementById('playPause');
const btnNext = document.getElementById('next');

let backendUrl = 'http://127.0.0.1:8787';

async function backendFetch(path, method = 'GET') {
  const response = await fetch(`${backendUrl}${path}`, { method });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    throw body;
  }

  return body;
}

function setStatus(message, bad = false) {
  statusEl.textContent = message;
  statusEl.style.color = bad ? '#f87171' : '#94a3b8';
}

async function loginSpotify() {
  try {
    const { authorizeURL } = await backendFetch('/auth/login');
    await window.desktopAPI.openExternal(authorizeURL);
    setStatus('Connexion ouverte dans le navigateur');
  } catch (error) {
    setStatus(error.details || 'Impossible de lancer la connexion', true);
  }
}

async function refreshPlayback() {
  try {
    const data = await backendFetch('/api/player/current');

    titleEl.textContent = data.title;
    artistEl.textContent = data.artist;
    stateEl.textContent = data.isPlaying ? 'playing' : 'paused';
    coverEl.src = data.albumImage || '';
    setStatus('Connecté');
  } catch (error) {
    if (error.loginUrl) {
      setStatus('Non connecté à Spotify', true);
    } else {
      setStatus('Spotify indisponible', true);
    }
  }
}

async function runAction(path) {
  try {
    await backendFetch(path, 'POST');
    await refreshPlayback();
  } catch {
    setStatus('Action impossible (Spotify fermé ?)', true);
  }
}

async function bootstrap() {
  const config = await window.desktopAPI.getConfig();
  backendUrl = config.backendUrl;

  btnConnect.addEventListener('click', loginSpotify);
  btnPrev.addEventListener('click', () => runAction('/api/player/previous'));
  btnPlayPause.addEventListener('click', () => runAction('/api/player/play-pause'));
  btnNext.addEventListener('click', () => runAction('/api/player/next'));

  await refreshPlayback();
  setInterval(refreshPlayback, 4000);
}

bootstrap();
