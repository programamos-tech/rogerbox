'use client';

import MuxPlayer from '@mux/mux-player-react';
import {
  Calendar,
  CheckCircle,
  Pause,
  Play,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { complementoToRetoInUi } from '@/lib/uiRetoLabels';

interface WeeklyComplement {
  id: string;
  week_number: number;
  year: number;
  day_of_week: number | string;
  title: string;
  description: string | null;
  mux_playback_id: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
}

interface StoriesSectionProps {
  courseStartDate?: string | null;
}

// Mapeo de número de día a nombre en español
const dayNumberToName: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export default function StoriesSection({
  courseStartDate,
}: StoriesSectionProps) {
  const { user } = useSupabaseAuth();
  const [todayComplement, setTodayComplement] =
    useState<WeeklyComplement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const handlePlayerPlay = () => {
    const player = playerContainerRef.current?.querySelector('mux-player') as
      | HTMLMediaElement
      | undefined;
    player?.play?.();
  };
  const handlePlayerPause = () => {
    const player = playerContainerRef.current?.querySelector('mux-player') as
      | HTMLMediaElement
      | undefined;
    player?.pause?.();
  };
  const handlePlayerMute = () => {
    const player = playerContainerRef.current?.querySelector('mux-player');
    if (!player) return;
    const next = !isMuted;
    if ('muted' in player) (player as HTMLMediaElement).muted = next;
    else if (next) player.setAttribute('muted', '');
    else player.removeAttribute('muted');
    setIsMuted(next);
  };

  // Obtener el día de la semana actual (1=Lunes, ..., 7=Domingo)
  const getCurrentDayOfWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    return day === 0 ? 7 : day;
  };

  const currentDayOfWeek = getCurrentDayOfWeek();
  const displayDayName = dayNumberToName[currentDayOfWeek];
  const isWeekend = currentDayOfWeek >= 6;

  // Cargar el complemento del día desde la API
  useEffect(() => {
    const loadTodayComplement = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/complements/today');
        const result = await response.json();

        if (result.complement) {
          setTodayComplement(result.complement);
        } else {
          setTodayComplement(null);
        }
      } catch (error) {
        setTodayComplement(null);
      } finally {
        setLoading(false);
      }
    };

    loadTodayComplement();
  }, []);

  // Cargar estado de completado
  useEffect(() => {
    const loadCompletionStatus = async () => {
      if (!user?.id || !todayComplement) return;

      try {
        const response = await fetch('/api/user-interactions?type=completed');
        if (response.ok) {
          const data = await response.json();
          const completed = data.interactions?.some(
            (i: any) =>
              i.complement_id === todayComplement.id && i.is_completed,
          );
          setIsCompleted(completed || false);
        }
      } catch (error) {}
    };

    loadCompletionStatus();
  }, [user?.id, todayComplement]);

  // Abrir modal de video
  const handlePlayClick = () => {
    if (todayComplement?.mux_playback_id) {
      setIsMuted(false);
      setShowModal(true);
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Marcar como completado
  const [isCompleting, setIsCompleting] = useState(false);

  const handleMarkComplete = async () => {
    if (!todayComplement || !user?.id || isCompleting) return;

    setIsCompleting(true);

    try {
      const response = await fetch('/api/user-interactions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complement_id: todayComplement.id }),
      });

      if (response.ok) {
        setIsCompleted(true);
        // Pequeño delay para mostrar el estado completado antes de cerrar
        setTimeout(() => {
          handleCloseModal();
        }, 800);
      }
    } catch (error) {
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[380px] sm:min-h-[480px] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
        <div className="p-4 sm:p-5 flex-shrink-0">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
        </div>
        <div className="flex-1 min-h-[300px] sm:min-h-[400px] bg-gray-100 dark:bg-gray-700 mx-4 mb-4 rounded-xl"></div>
      </div>
    );
  }

  // Sin complemento para hoy - ocultar la sección
  if (!todayComplement) {
    return null;
  }

  return (
    <>
      <div className="w-full h-full min-h-[380px] sm:min-h-[480px] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header - Mismo estilo que Tu Progreso */}
        <div className="p-4 sm:p-5 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-[#85ea10]" />
            <span>Reto de la semana</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tips, ejercicios, consejos y más
          </p>
        </div>

        {/* Video Card — alineado con la marca: limpio, acento sutil */}
        <div className="flex-1 relative min-h-[280px] sm:min-h-[340px] px-3 pb-3">
          <div
            onClick={handlePlayClick}
            className={`
              group relative w-full h-full cursor-pointer overflow-hidden rounded-xl
              border border-gray-200 dark:border-gray-600/50
              ${!todayComplement.mux_playback_id ? 'cursor-not-allowed' : ''}
            `}
          >
            {/* Thumbnail */}
            <div
              className={`absolute inset-0 bg-gray-900 transition-all duration-300 ${isCompleted ? 'grayscale' : ''}`}
            >
              {todayComplement.mux_playback_id ? (
                <img
                  src={`https://image.mux.com/${todayComplement.mux_playback_id}/thumbnail.jpg?time=1`}
                  alt={complementoToRetoInUi(todayComplement.title)}
                  className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02] ${isCompleted ? 'grayscale opacity-80' : ''}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-14 h-14 text-gray-500" />
                </div>
              )}
            </div>

            {/* Gradiente solo abajo para texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {/* Top: día como pill sutil */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-md">
                  {displayDayName}
                </span>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-white/90 bg-[#85ea10]/20 text-[#85ea10] px-2.5 py-1 rounded-md">
                    <CheckCircle className="w-3 h-3" />
                    Hecho
                  </span>
                )}
              </div>

              {/* Center: play discreto (marca) */}
              {todayComplement.mux_playback_id && !isCompleted && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:bg-white group-hover:scale-105 transition-all duration-200">
                    <Play
                      className="w-6 h-6 text-gray-900 ml-0.5"
                      fill="currentColor"
                    />
                  </div>
                </div>
              )}

              {/* Bottom: título y CTA */}
              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {isWeekend
                    ? 'Reto fin de semana'
                    : complementoToRetoInUi(todayComplement.title)}
                </h4>
                    {todayComplement.description && (
                  <p className="text-xs text-white/70 line-clamp-2">
                    {complementoToRetoInUi(todayComplement.description)}
                  </p>
                )}
                {todayComplement.mux_playback_id && !isCompleted && (
                  <p className="text-xs font-medium text-white/80 pt-0.5">
                    Toca para reproducir
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card de reproducción (modal negro) — solo botón play visible */}
      {showModal && todayComplement?.mux_playback_id && (
        <div className="complement-video-modal fixed inset-0 z-50 flex flex-col bg-black">
          {/* 1. Reproductor MUX: solo play (resto oculto por CSS) */}
          <div ref={playerContainerRef} className="absolute inset-0">
            <MuxPlayer
              playbackId={todayComplement.mux_playback_id}
              streamType="on-demand"
              autoPlay
              muted={false}
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                ['--controls' as string]: 'auto',
                ['--media-accent-color' as string]: '#85ea10',
              }}
              envKey={process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY}
              metadata={{
                video_id: todayComplement.id,
                video_title: todayComplement.title,
                viewer_user_id: user?.id || 'anonymous',
                video_content_type: 'complement',
                video_series: `Semana ${todayComplement.week_number}`,
              }}
            />
          </div>

          {/* 2. Barra superior única: no tapa la zona de controles de MUX */}
          <header
            className="relative z-10 flex items-center justify-between gap-3 px-4 pb-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 24px), 24px)' }}
          >
            <div className="pointer-events-auto flex items-center gap-3 min-w-0">
              <span className="text-white font-black text-sm tracking-tight">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </span>
              <span className="text-white/50 text-xs font-medium truncate">
                {displayDayName} ·{' '}
                {complementoToRetoInUi(todayComplement.title)}
              </span>
            </div>
            <div className="pointer-events-auto flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePlayerPlay}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                aria-label="Play"
              >
                <Play className="w-5 h-5 text-white" fill="currentColor" />
              </button>
              <button
                onClick={handlePlayerPause}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                aria-label="Pausar"
              >
                <Pause className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handlePlayerMute}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              {!isCompleted ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isCompleting ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Completado
                    </>
                  )}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white/80 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 fill-white/80" />
                  Hecho
                </span>
              )}
              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </header>
        </div>
      )}
    </>
  );
}
