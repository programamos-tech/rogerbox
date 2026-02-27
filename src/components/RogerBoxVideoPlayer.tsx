'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface RogerBoxVideoPlayerProps {
  videoId: string;
  courseImage: string;
  courseTitle: string;
  autoPlay?: boolean;
}

export default function RogerBoxVideoPlayer({
  videoId,
  courseImage,
  courseTitle,
  autoPlay = true
}: RogerBoxVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // CSS para ocultar completamente los controles de YouTube
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .rogerbox-player iframe {
        pointer-events: none !important;
      }
      .rogerbox-player .ytp-title,
      .rogerbox-player .ytp-chrome-top,
      .rogerbox-player .ytp-show-cards-title,
      .rogerbox-player .ytp-impression-link,
      .rogerbox-player .ytp-watermark,
      .rogerbox-player .ytp-chrome-bottom,
      .rogerbox-player .ytp-progress-bar-container,
      .rogerbox-player .ytp-chrome-controls,
      .rogerbox-player .ytp-chrome-top-buttons,
      .rogerbox-player .ytp-pause-overlay,
      .rogerbox-player .ytp-suggested-action,
      .rogerbox-player .ytp-endscreen-content {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Cargar API de YouTube
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API cargada');
        initializePlayer();
      };
    } else {
      initializePlayer();
    }
  }, []);

  // Inicializar reproductor cuando el componente esté listo
  useEffect(() => {
    if (window.YT && playerRef.current && !youtubePlayer) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        initializePlayer();
      }, 100);
    }
  }, [videoId]);

  const initializePlayer = () => {
    if (window.YT && playerRef.current && !youtubePlayer) {
      const player = new window.YT.Player(playerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          mute: 0,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          cc_load_policy: 0,
          disablekb: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          // Parámetros de calidad más agresivos
          vq: 'hd1080',
          hd: 1,
          quality: 'hd1080'
        },
        events: {
          onReady: (event: any) => {
            console.log('✅ Reproductor RogerBox listo');
            setYoutubePlayer(event.target);
            setIsLoading(false);
            
            // Forzar calidad HD múltiples veces
            const forceHD = () => {
              try {
                event.target.setPlaybackQuality('hd1080');
                console.log('🎬 Forzando calidad HD');
              } catch (error) {
                console.warn('⚠️ Error al forzar HD:', error);
              }
            };
            
            forceHD();
            if (autoPlay) {
              event.target.playVideo();
              // Reintentar HD después de que empiece
              setTimeout(forceHD, 1000);
              setTimeout(forceHD, 3000);
              setTimeout(forceHD, 5000);
            }
          },
          onStateChange: (event: any) => {
            const isPlaying = event.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(isPlaying);
          },
          onError: (event: any) => {
            console.error('❌ Error en el reproductor:', event.data);
            setIsLoading(false);
          }
        }
      });
    }
  };

  // Actualizar progreso cada segundo
  useEffect(() => {
    if (youtubePlayer && isPlaying) {
      const interval = setInterval(() => {
        try {
          const current = youtubePlayer.getCurrentTime();
          const total = youtubePlayer.getDuration();
          setCurrentTime(current);
          setDuration(total);
          setProgress((current / total) * 100);
        } catch (error) {
          console.warn('Error al obtener tiempo del video:', error);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [youtubePlayer, isPlaying]);

  const togglePlayPause = () => {
    console.log('🎮 togglePlayPause llamado, youtubePlayer:', !!youtubePlayer, 'isPlaying:', isPlaying);
    
    if (youtubePlayer) {
      if (isPlaying) {
        // Guardar el tiempo actual antes de pausar
        try {
          const time = youtubePlayer.getCurrentTime();
          setCurrentTime(time);
          console.log('⏸️ Tiempo guardado:', time);
          youtubePlayer.pauseVideo();
        } catch (error) {
          console.warn('⚠️ Error al pausar:', error);
          setIsPlaying(false);
        }
      } else {
        try {
          youtubePlayer.playVideo();
          // Forzar HD al reanudar
          youtubePlayer.setPlaybackQuality('hd1080');
          console.log('🎬 Calidad HD forzada al reanudar');
        } catch (error) {
          console.warn('⚠️ Error al reproducir:', error);
          setIsPlaying(true);
        }
      }
    } else {
      console.warn('⚠️ Reproductor no disponible, cambiando estado manualmente');
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        // Entrar a pantalla completa
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Salir de pantalla completa
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.warn('⚠️ Error al cambiar pantalla completa:', error);
    }
  };

  // Escuchar cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // F11 para pantalla completa
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
      // ESC para salir de pantalla completa
      if (event.key === 'Escape' && isFullscreen) {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg group rogerbox-player ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Contenedor con aspect ratio 16:9 para que coincida con el video */}
      <div className={`relative w-full ${isFullscreen ? 'h-screen' : 'aspect-video'}`}>
        {/* Video de YouTube (siempre presente) */}
        <div
          ref={playerRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Imagen del curso (siempre presente, pero oculta cuando está reproduciendo) */}
        <img
          src={courseImage}
          alt={courseTitle}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${
            isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />


                {/* Controles personalizados de RogerBox */}
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <button
                    onClick={togglePlayPause}
                    className={`w-16 h-16 bg-[#85ea10] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 ${
                      isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-black" />
                    ) : (
                      <Play className="w-6 h-6 text-black ml-1" />
                    )}
                  </button>
                </div>

                {/* Botón de pantalla completa */}
                <div className="absolute top-4 right-4 z-30">
                  <button
                    onClick={toggleFullscreen}
                    className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </button>
                </div>

        {/* Barra de progreso de RogerBox - Solo visible cuando está pausado */}
        {!isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
            <div className="bg-white/20 rounded-full h-1 mb-2">
              <div
                className="bg-[#85ea10] h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-white text-sm">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Logo de RogerBox */}
        <div className="absolute bottom-4 right-4 z-30">
          <span className="text-white/50 font-bold text-sm tracking-wide drop-shadow-md">
            ROGERBOX
          </span>
        </div>

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-[#85ea10] border-opacity-75"></div>
          </div>
        )}
      </div>
    </div>
  );
}