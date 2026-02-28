
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
];

function createAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES.join(' '),
    redirect_uri: REDIRECT_URI
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    throw new Error(`TOKEN_EXCHANGE_FAILED: ${response.status}`);
  }

  return response.json();
}

async function spotifyRequest(url, { method = 'GET', token }) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new Error(`SPOTIFY_API_ERROR ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function getCurrentlyPlaying(token) {
  const data = await spotifyRequest('https://api.spotify.com/v1/me/player/currently-playing', {
    token
  });

  if (!data || !data.item) {
    return {
      isPlaying: false,
      trackName: 'Aucune piste en cours',
      artistName: '—',
      albumArt: ''
    };
  }

  return {
    isPlaying: Boolean(data.is_playing),
    trackName: data.item.name,
    artistName: data.item.artists.map((artist) => artist.name).join(', '),
    albumArt: data.item.album.images?.[0]?.url || ''
  };
}

async function play(token) {
  return spotifyRequest('https://api.spotify.com/v1/me/player/play', { method: 'PUT', token });
}

async function pause(token) {
  return spotifyRequest('https://api.spotify.com/v1/me/player/pause', { method: 'PUT', token });
}

async function nextTrack(token) {
  return spotifyRequest('https://api.spotify.com/v1/me/player/next', { method: 'POST', token });
}

async function previousTrack(token) {
  return spotifyRequest('https://api.spotify.com/v1/me/player/previous', { method: 'POST', token });
}

module.exports = {
  createAuthUrl,
  exchangeCodeForToken,
  getCurrentlyPlaying,
  play,
  pause,
  nextTrack,
  previousTrack
};
