import Hls, { type HlsConfig } from 'hls.js';

const DEFAULT_HLS_CONFIG: Partial<HlsConfig> = {
  enableWorker: true,
  lowLatencyMode: false,
  debug: false,
};

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
