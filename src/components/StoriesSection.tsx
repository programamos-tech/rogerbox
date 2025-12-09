'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Video, CheckCircle, X, Calendar } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import MuxPlayer from '@mux/mux-player-react';

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

export default function StoriesSection({ courseStartDate }: StoriesSectionProps) {
  const { user } = useSupabaseAuth();
  const [todayComplement, setTodayComplement] = useState<WeeklyComplement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Obtener el día de la semana actual (1=Lunes, ..., 7=Domingo)
  const getCurrentDayOfWeek = () => {
    const today = new Date();
    let day = today.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
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
        
        console.log('🔍 API Response:', result);
        
        if (result.complement) {
          setTodayComplement(result.complement);
        } else {
          console.log('❌ No hay complemento para hoy');
          setTodayComplement(null);
        }
      } catch (error) {
        console.error('Error loading complement:', error);
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
            (i: any) => i.complement_id === todayComplement.id && i.is_completed
          );
          setIsCompleted(completed || false);
        }
      } catch (error) {
        console.error('Error loading completion status:', error);
      }
    };

    loadCompletionStatus();
  }, [user?.id, todayComplement]);

  // Abrir modal de video
  const handlePlayClick = () => {
    if (todayComplement?.mux_playback_id) {
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
      console.error('Error completing complement:', error);
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
            <span>Complemento del Día</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {displayDayName} {isWeekend && '• Fin de semana'}
          </p>
        </div>

        {/* Video Card */}
        <div className="flex-1 relative min-h-[300px] sm:min-h-[400px] px-3 pb-3">
          <div
            onClick={handlePlayClick}
            className={`
              relative w-full h-full cursor-pointer overflow-hidden rounded-xl
              ${!todayComplement.mux_playback_id ? 'cursor-not-allowed' : ''}
            `}
          >
            {/* Thumbnail de Mux */}
            <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 transition-all duration-500 ${isCompleted ? 'grayscale' : ''}`}>
              {todayComplement.mux_playback_id ? (
                <img
                  src={`https://image.mux.com/${todayComplement.mux_playback_id}/thumbnail.jpg?time=1`}
                  alt={todayComplement.title}
                  className={`w-full h-full object-cover transition-all duration-500 ${isCompleted ? 'grayscale opacity-70' : ''}`}
                  onError={(e) => {
                    // Si falla el thumbnail, mostrar placeholder
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-16 h-16 text-gray-600" />
                </div>
              )}
            </div>

            {/* Gradiente overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {/* Top - Espacio reservado */}
              <div className="flex items-center justify-end">
                {/* Check ahora está en el centro */}
              </div>

              {/* Center - Botón de play o check si completado */}
              <div className="flex-1 flex items-center justify-center">
                {todayComplement.mux_playback_id ? (
                  isCompleted ? (
                    <div className="bg-[#85ea10] rounded-full p-5 shadow-2xl shadow-[#85ea10]/30">
                      <CheckCircle className="w-10 h-10 text-black" />
                    </div>
                  ) : (
                    <div className="bg-[#85ea10] rounded-full p-5 shadow-2xl shadow-[#85ea10]/30 hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-black ml-1" fill="currentColor" />
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <div className="bg-gray-700/80 backdrop-blur-sm rounded-full p-4">
                      <Video className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Video no disponible</p>
                  </div>
                )}
              </div>

              {/* Bottom - Título y descripción */}
              <div className="space-y-2">
                <h4 className="text-xl font-black text-white leading-tight">
                  {isWeekend ? 'Complemento Fin de Semana' : todayComplement.title}
                </h4>
                {todayComplement.description && (
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {todayComplement.description}
                  </p>
                )}
                
                {/* Indicador */}
                {todayComplement.mux_playback_id && !isCompleted && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-[#85ea10] rounded-full animate-pulse" />
                    <span className="text-[#85ea10] text-xs font-bold uppercase">Toca para ver</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Video - Estilo RogerBox */}
      {showModal && todayComplement?.mux_playback_id && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Video - Protagonista a pantalla completa */}
          <MuxPlayer
            playbackId={todayComplement.mux_playback_id}
            streamType="on-demand"
            autoPlay
            accentColor="#85ea10"
            className="absolute inset-0 w-full h-full"
            style={{ 
              '--controls': 'auto',
            } as React.CSSProperties}
            envKey={process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY}
            metadata={{
              video_id: todayComplement.id,
              video_title: todayComplement.title,
              viewer_user_id: user?.id || 'anonymous',
              video_content_type: 'complement',
              video_series: `Semana ${todayComplement.week_number}`,
            }}
          />

          {/* Header - Encima del video */}
          <div className="absolute top-0 left-0 right-0 z-20 pt-12 px-4 pb-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-white font-black text-sm">ROGER</span>
                <span className="text-[#85ea10] font-black text-sm">BOX</span>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Footer con info y botón */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="p-4 pb-6 safe-area-bottom">
              {/* Tags */}
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#85ea10] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {displayDayName}
                </span>
                {isWeekend && (
                  <span className="text-[#85ea10] text-[10px] font-medium">Fin de Semana</span>
                )}
              </div>
              
              {/* Título y descripción */}
              <h3 className="text-white font-bold text-lg mb-1">{todayComplement.title}</h3>
              {todayComplement.description && (
                <p className="text-white/70 text-sm mb-4 line-clamp-2">{todayComplement.description}</p>
              )}
              
              {/* Botón de completar */}
              {!isCompleted ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  className="w-full bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-[#85ea10]/70 text-black font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:scale-100"
                >
                  {isCompleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Marcar como Completado</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full bg-[#85ea10] text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 animate-pulse">
                  <CheckCircle className="w-5 h-5 fill-current" />
                  <span>¡Lo lograste! 💪</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
