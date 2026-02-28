const albumArt = document.getElementById('albumArt');
const trackName = document.getElementById('trackName');
const artistName = document.getElementById('artistName');
const statusText = document.getElementById('statusText');
const codeInput = document.getElementById('codeInput');

let isPlaying = false;

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? '#a31621' : '#3b2a1f';
}

async function refreshTrack() {
  const result = await window.spotifyBridge.getCurrent();

  if (!result.ok) {
    setStatus(`Erreur: ${result.error}`, true);
    return;
  }

  const current = result.data;
  isPlaying = current.isPlaying;
  trackName.textContent = current.trackName;
  artistName.textContent = current.artistName;
  albumArt.src = current.albumArt || '';
  setStatus(current.isPlaying ? 'Lecture en cours' : 'En pause');
}

document.getElementById('connectBtn').addEventListener('click', async () => {
  await window.spotifyBridge.openAuth();
  setStatus('Autorise Spotify puis colle le paramètre code.');
});

document.getElementById('validateBtn').addEventListener('click', async () => {
  const value = codeInput.value.trim();
  if (!value) {
    setStatus('Ajoute le code OAuth.', true);
    return;
  }

  const maybeUrl = value.includes('code=') ? value : `code=${value}`;
  const params = new URLSearchParams(maybeUrl.split('?').pop());
  const code = params.get('code');
  if (!code) {
    setStatus('Code OAuth introuvable.', true);
    return;
  }

  const result = await window.spotifyBridge.authCallback(code);
  if (!result.ok) {
    setStatus(`Connexion échouée: ${result.error}`, true);
    return;
  }

  setStatus('Connecté à Spotify.');
  await refreshTrack();
});

document.getElementById('playPauseBtn').addEventListener('click', async () => {
  const result = await window.spotifyBridge.playPause(!isPlaying);
  if (!result.ok) {
    setStatus(`Action impossible: ${result.error}`, true);
    return;
  }
  await refreshTrack();
});

document.getElementById('nextBtn').addEventListener('click', async () => {
  const result = await window.spotifyBridge.next();
  if (!result.ok) {
    setStatus(`Action impossible: ${result.error}`, true);
    return;
  }
  await refreshTrack();
});

document.getElementById('prevBtn').addEventListener('click', async () => {
  const result = await window.spotifyBridge.previous();
  if (!result.ok) {
    setStatus(`Action impossible: ${result.error}`, true);
    return;
  }
  await refreshTrack();
});
