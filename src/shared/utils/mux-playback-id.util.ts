export function extractMuxPlaybackId(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  let playbackId = raw.trim();
  if (!playbackId) return null;

  if (playbackId.includes('stream.mux.com')) {
    const match = playbackId.match(/stream\.mux\.com\/([^/?.]+)/);
    if (match?.[1]) playbackId = match[1];
  } else if (playbackId.includes('player.mux.com')) {
    const match = playbackId.match(/player\.mux\.com\/([^/?.]+)/);
    if (match?.[1]) playbackId = match[1];
  }

  playbackId = (playbackId.replace(/\.m3u8$/i, '').split('?')[0] || '').trim();
  return playbackId.length >= 8 ? playbackId : null;
}

export function buildMuxHlsUrl(
  playbackId: string,
  token?: string | null,
): string {
  const url = `https://stream.mux.com/${playbackId}.m3u8`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}
