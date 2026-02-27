'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
import { getMuxVideoUrl } from '@/lib/mux-config';

interface MuxVideoPlayerProps {
  videoId: string;
  courseImage: string;
  courseTitle: string;
  autoPlay?: boolean;
}

export default function MuxVideoPlayer({
  videoId,
  courseImage,
  courseTitle,
  autoPlay = false,
}: MuxVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mux video URL usando la configuración
  const muxVideoUrl = getMuxVideoUrl(videoId, 'auto');

  // Manejar eventos del video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-play cuando el componente se monta
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(console.warn);
    }
  }, [autoPlay]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.warn);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          (containerRef.current as any).msRequestFullscreen();
        }
      } else {
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
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg group ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Contenedor con aspect ratio 16:9 */}
      <div className={`relative w-full ${isFullscreen ? 'h-screen' : 'aspect-video'}`}>
        {/* Video de Mux */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={muxVideoUrl}
          preload="metadata"
          playsInline
          muted={!autoPlay}
        />

        {/* Imagen del curso (solo visible cuando está pausado) */}
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

        {/* Barra de progreso - Solo visible cuando está pausado */}
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
