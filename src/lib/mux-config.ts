// Configuración temporal de Mux para testing
export const MUX_TEMP_CONFIG = {
  // Tu API key de Mux
  TOKEN_ID: 'uavuaimch723h0oil512vg5kp',
  
  // Video de prueba (reemplaza con tu Playback ID)
  SAMPLE_PLAYBACK_ID: 'your_mux_playback_id_here',
  
  // URLs base de Mux
  STREAM_URL: 'https://stream.mux.com',
  THUMBNAIL_URL: 'https://image.mux.com',
};

// Función para generar URL de video de Mux
export function getMuxVideoUrl(playbackId: string, quality: string = 'auto') {
  const baseUrl = `${MUX_TEMP_CONFIG.STREAM_URL}/${playbackId}`;
  
  if (quality === 'auto') {
    return `${baseUrl}.m3u8`; // HLS para streaming adaptativo
  }
  
  return `${baseUrl}.m3u8?quality=${quality}`;
}

// Función para generar URL de thumbnail
export function getMuxThumbnailUrl(playbackId: string, width: number = 1280, height: number = 720) {
  return `${MUX_TEMP_CONFIG.THUMBNAIL_URL}/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=smartcrop`;
}
