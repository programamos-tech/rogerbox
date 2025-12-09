// Mux configuration
export const MUX_CONFIG = {
  // Reemplaza con tus credenciales de Mux
  TOKEN_ID: process.env.NEXT_PUBLIC_MUX_TOKEN_ID || '',
  PLAYBACK_ID: process.env.NEXT_PUBLIC_MUX_PLAYBACK_ID || '',
  
  // URLs base de Mux
  STREAM_URL: 'https://stream.mux.com',
  THUMBNAIL_URL: 'https://image.mux.com',
  
  // Configuración de calidad
  DEFAULT_QUALITY: 'auto', // auto, 1080p, 720p, 480p, 360p
  ENABLE_HD: true,
  
  // Configuración de streaming
  ENABLE_HLS: true,
  ENABLE_DASH: true,
  ENABLE_MP4: true,
};

// Mux Data - Video Analytics & Engagement Tracking
// Environment key from Mux Dashboard > Data > Get Started
export const MUX_DATA_ENV_KEY = process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY || '';

// Función para generar URL de video de Mux
export function getMuxVideoUrl(playbackId: string, quality: string = 'auto') {
  const baseUrl = `${MUX_CONFIG.STREAM_URL}/${playbackId}`;
  
  if (quality === 'auto') {
    return `${baseUrl}.m3u8`; // HLS para streaming adaptativo
  }
  
  return `${baseUrl}.m3u8?quality=${quality}`;
}

// Función para generar URL de thumbnail
export function getMuxThumbnailUrl(playbackId: string, width: number = 1280, height: number = 720) {
  return `${MUX_CONFIG.THUMBNAIL_URL}/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=smartcrop`;
}

// Función para generar URL de GIF (para previews)
export function getMuxGifUrl(playbackId: string, width: number = 640, height: number = 360) {
  return `${MUX_CONFIG.THUMBNAIL_URL}/${playbackId}/animated.gif?width=${width}&height=${height}&fit_mode=smartcrop`;
}
