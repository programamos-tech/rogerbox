'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Video } from 'lucide-react';

interface Story {
  id: string;
  video: string;
  title?: string;
  availableDate?: string;
  isAvailable?: boolean;
}

export default function StoriesSection() {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Función para verificar si una historia está disponible
  const isStoryAvailable = (index: number) => {
    return index === 0; // Solo la primera historia está disponible
  };

  // Función para obtener el mensaje de disponibilidad
  const getAvailabilityMessage = (index: number) => {
    if (index === 0) return null;
    if (index === 1) return 'Mañana';
    if (index === 2) return 'En 2 días';
    return `En ${index} días`;
  };

  // Videos de complementos disponibles - 5 días
  const stories: Story[] = [
    { id: '1', video: '/complementos/1.mp4', title: 'Complemento 1', isAvailable: true },
    { id: '2', video: '/complementos/2.mp4', title: 'Complemento 2', isAvailable: false },
    { id: '3', video: '/complementos/3.mp4', title: 'Complemento 3', isAvailable: false },
    { id: '4', video: '/complementos/4.mp4', title: 'Complemento 4', isAvailable: false },
    { id: '5', video: '/complementos/5.mp4', title: 'Complemento 5', isAvailable: false },
  ];

  const currentStory = stories[currentStoryIndex];
  const isAvailable = isStoryAvailable(currentStoryIndex);

  // Auto-play del primer video por 5 segundos
  useEffect(() => {
    if (currentStoryIndex === 0 && !hasAutoPlayed && isStoryAvailable(0)) {
      // Pequeño delay para asegurar que el video esté cargado
      const initTimer = setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.currentTime = 0;
          video.play().then(() => {
            setIsPlaying(true);
            setShowPlayButton(false);
          }).catch(() => {
            // Si falla el autoplay, mostrar botón de play
            setIsPlaying(false);
            setShowPlayButton(true);
          });
        }
      }, 200);
      
      // Pausar después de 5 segundos
      const pauseTimer = setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.pause();
          setIsPlaying(false);
          setShowPlayButton(true);
          setHasAutoPlayed(true);
        }
      }, 5200);

      return () => {
        clearTimeout(initTimer);
        clearTimeout(pauseTimer);
      };
    }
  }, [currentStoryIndex, hasAutoPlayed]);

  // Manejar play/pause
  const handlePlayPause = () => {
    if (videoRef.current && isAvailable) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        setShowPlayButton(false);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 min-h-0">
      {/* Header con Icono */}
      <div className="mb-4 flex-shrink-0">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-1">
          <Video className="w-5 h-5 text-[#85ea10]" />
          <span>Complementos Diarios</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nuevo contenido todos los días
        </p>
      </div>

      {/* Carrusel de Historias - 5 días - Ocupa todo el espacio vertical */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="relative flex-1 min-h-0">
          {/* Botones de navegación */}
          {currentStoryIndex > 0 && (
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.pause();
                }
                const prevIndex = currentStoryIndex - 1;
                setCurrentStoryIndex(prevIndex);
                setIsPlaying(false);
                setShowPlayButton(isStoryAvailable(prevIndex));
                if (prevIndex === 0 && !hasAutoPlayed) {
                  setHasAutoPlayed(false);
                }
                // Scroll al elemento anterior
                const container = document.getElementById('stories-carousel');
                if (container) {
                  const button = container.querySelector(`[data-story-index="${prevIndex}"]`) as HTMLElement;
                  if (button) {
                    button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }
                }
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:scale-110 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-white" />
            </button>
          )}
          
          {currentStoryIndex < stories.length - 1 && (
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.pause();
                }
                const nextIndex = currentStoryIndex + 1;
                setCurrentStoryIndex(nextIndex);
                setIsPlaying(false);
                setShowPlayButton(isStoryAvailable(nextIndex));
                if (nextIndex === 0 && !hasAutoPlayed) {
                  setHasAutoPlayed(false);
                }
                // Scroll al elemento siguiente
                const container = document.getElementById('stories-carousel');
                if (container) {
                  const button = container.querySelector(`[data-story-index="${nextIndex}"]`) as HTMLElement;
                  if (button) {
                    button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:scale-110 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-900 dark:text-white" />
            </button>
          )}

          {/* Contenedor del carrusel - Ocupa todo el espacio vertical */}
          <div 
            id="stories-carousel"
            className="overflow-x-auto scrollbar-hide h-full"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-4 h-full items-center">
              {stories.map((story, index) => {
                const storyIsAvailable = isStoryAvailable(index);
                const isCurrent = index === currentStoryIndex;
                return (
                  <button
                    key={story.id}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.pause();
                      }
                      setCurrentStoryIndex(index);
                      setIsPlaying(false);
                      setShowPlayButton(storyIsAvailable);
                      if (index === 0 && !hasAutoPlayed) {
                        setHasAutoPlayed(false);
                      }
                      // Scroll suave al elemento seleccionado
                      const container = document.getElementById('stories-carousel');
                      if (container) {
                        const button = container.querySelector(`[data-story-index="${index}"]`) as HTMLElement;
                        if (button) {
                          button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }
                      }
                    }}
                    data-story-index={index}
                    className={`flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all h-full ${
                      isCurrent
                        ? 'border-[#85ea10] shadow-lg scale-105'
                        : 'border-gray-300 dark:border-gray-600 opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      aspectRatio: '9/16',
                      width: 'calc(40% - 16px)',
                      minWidth: '280px',
                      maxWidth: '320px',
                      height: '100%'
                    }}
                  >
                <video
                  ref={index === currentStoryIndex ? videoRef : null}
                  key={`${story.id}-${index === currentStoryIndex ? 'active' : 'thumb'}`}
                  src={story.video}
                  loop={false}
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!storyIsAvailable ? 'grayscale' : ''}`}
                  style={!storyIsAvailable ? { filter: 'grayscale(100%) brightness(0.6)' } : {}}
                  onEnded={() => {
                    if (index === currentStoryIndex && storyIsAvailable) {
                      setIsPlaying(false);
                      setShowPlayButton(true);
                    }
                  }}
                  onPlay={() => {
                    if (index === currentStoryIndex) {
                      setIsPlaying(true);
                      setShowPlayButton(false);
                    }
                  }}
                  onPause={() => {
                    if (index === currentStoryIndex) {
                      setIsPlaying(false);
                      if (hasAutoPlayed || currentStoryIndex !== 0) {
                        setShowPlayButton(true);
                      }
                    }
                  }}
                />
                {!storyIsAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-[9px] font-medium">
                      {getAvailabilityMessage(index)}
                    </span>
                  </div>
                )}
                {index === currentStoryIndex && storyIsAvailable && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-200 cursor-pointer ${
                      showPlayButton || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-2xl">
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-gray-900" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                      )}
                    </div>
                  </div>
                )}
              </button>
                );
              })}
            </div>
          </div>

          {/* Indicadores de posición */}
          <div className="flex justify-center gap-1.5 mt-3">
            {stories.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStoryIndex
                    ? 'bg-[#85ea10] w-6'
                    : 'bg-gray-300 dark:bg-gray-600 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
