const SpotifyWebApi = require('spotify-web-api-node');

function createSpotifyClient(config) {
  return new SpotifyWebApi({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri
  });
}

async function getCurrentPlayback(spotifyApi) {
  const response = await spotifyApi.getMyCurrentPlaybackState();
  const body = response.body || {};
  const item = body.item || {};

  return {
    isPlaying: !!body.is_playing,
    progressMs: body.progress_ms || 0,
    durationMs: item.duration_ms || 0,
    title: item.name || 'Aucun titre',
    artist: (item.artists || []).map((artist) => artist.name).join(', ') || 'Artiste inconnu',
    albumImage: item.album?.images?.[0]?.url || null,
    device: body.device?.name || null
  };
}

async function playPause(spotifyApi) {
  const current = await spotifyApi.getMyCurrentPlaybackState();
  if (current.body?.is_playing) {
    await spotifyApi.pause();
    return { action: 'paused' };
  }

  await spotifyApi.play();
  return { action: 'playing' };
}

module.exports = {
  createSpotifyClient,
  getCurrentPlayback,
  playPause
};
