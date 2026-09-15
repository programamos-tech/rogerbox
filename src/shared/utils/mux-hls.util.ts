import Hls, { type HlsConfig } from 'hls.js';
import {
  buildMuxHlsUrl,
  extractMuxPlaybackId,
} from '@/shared/utils/mux-playback-id.util';

export { buildMuxHlsUrl, extractMuxPlaybackId };

const DEFAULT_HLS_CONFIG: Partial<HlsConfig> = {
  enableWorker: true,
  lowLatencyMode: false,
  debug: false,
};

export type MuxPlaybackResponse = {
  playbackId: string;
  url: string;
  token: string | null;
};

export async function fetchMuxPlayback(
  playbackId: string,
): Promise<MuxPlaybackResponse> {
  const res = await fetch(
    `/api/mux/playback-url?playbackId=${encodeURIComponent(playbackId)}`,
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error || 'No se pudo autorizar el video en Mux');
  }
  return (await res.json()) as MuxPlaybackResponse;
}

/**
 * Chrome 142+ (and other Chromium browsers) report native HLS via
 * `canPlayType('application/vnd.apple.mpegurl')`, but Mux streams often fail
 * on that path. Prefer hls.js whenever MSE is available; native HLS is only
 * the fallback (Safari/iOS without MSE).
 */
export function isHlsJsPlaybackSupported(): boolean {
  return Hls.isSupported();
}

export function createMuxHlsPlayer(config?: Partial<HlsConfig>): Hls {
  return new Hls({
    ...DEFAULT_HLS_CONFIG,
    ...config,
  });
}

export function canUseNativeHlsFallback(video: HTMLVideoElement): boolean {
  return Boolean(video.canPlayType('application/vnd.apple.mpegurl'));
}
