'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Video, CheckCircle, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Complement {
  id: string;
  dayOfWeek: number; // 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes
  video: string;
  title: string;
  dayName: string;
}

interface StoriesSectionProps {
  courseStartDate?: string | null;
}

export default function StoriesSection({ courseStartDate }: StoriesSectionProps) {
  const { data: session } = useSession();
  const [completedComplements, setCompletedComplements] = useState<Set<string>>(new Set());
  const [selectedComplement, setSelectedComplement] = useState<Complement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutos en segundos
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Nombres de los días
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  // 5 complementos diarios (uno por cada día de la semana laboral)
  const allComplements: Complement[] = [
    { id: '1', dayOfWeek: 1, video: '/complementos/1.mp4', title: 'Complemento Lunes', dayName: 'Lunes' },
    { id: '2', dayOfWeek: 2, video: '/complementos/2.mp4', title: 'Complemento Martes', dayName: 'Martes' },
    { id: '3', dayOfWeek: 3, video: '/complementos/3.mp4', title: 'Complemento Miércoles', dayName: 'Miércoles' },
    { id: '4', dayOfWeek: 4, video: '/complementos/4.mp4', title: 'Complemento Jueves', dayName: 'Jueves' },
    { id: '5', dayOfWeek: 5, video: '/complementos/4.mp4', title: 'Complemento Viernes', dayName: 'Viernes' },
  ];

  // Obtener el día de la semana actual (1=Lunes, 2=Martes, etc.)
  const getCurrentDayOfWeek = () => {
    const today = new Date();
    let day = today.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    // Convertir a formato donde 1=Lunes, 2=Martes, etc.
    day = day === 0 ? 7 : day; // Domingo = 7
    day = day - 1; // Ahora 0=Lunes, 1=Martes, etc.
    return day + 1; // 1=Lunes, 2=Martes, etc.
  };

  const currentDayOfWeek = getCurrentDayOfWeek();
  
  // Inicializar el índice al complemento del día actual
  useEffect(() => {
    const todayIndex = allComplements.findIndex(c => c.dayOfWeek === currentDayOfWeek);
    if (todayIndex !== -1) {
      setCurrentIndex(todayIndex);
    }
  }, [currentDayOfWeek]);

  // Calcular qué complementos están disponibles
  const getAvailableComplements = () => {
    return allComplements.map(complement => ({
      ...complement,
      isAvailable: true,
      isToday: complement.dayOfWeek === currentDayOfWeek,
      isCompleted: completedComplements.has(complement.id),
      isDisabled: complement.dayOfWeek !== currentDayOfWeek // Días que no son hoy están inhabilitados
    }));
  };

  // Cargar complementos completados del usuario
  useEffect(() => {
    const loadCompletedComplements = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user-interactions?type=completed');
        if (response.ok) {
          const data = await response.json();
          const completed = new Set(
            data.interactions
              .filter((i: any) => i.is_completed)
              .map((i: any) => i.complement_id)
          );
          setCompletedComplements(completed);
        }
      } catch (error) {
        console.error('Error loading completed complements:', error);
      }
    };

    loadCompletedComplements();
  }, [session]);

  // Manejar el cronómetro
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timerActive, timeRemaining]);

  // Formatear tiempo del cronómetro
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Iniciar cronómetro
  const handleStartTimer = () => {
    setTimerActive(true);
  };

  // Pausar cronómetro
  const handlePauseTimer = () => {
    setTimerActive(false);
  };

  // Resetear cronómetro
  const handleResetTimer = () => {
    setTimerActive(false);
    setTimeRemaining(600);
  };

  // Cuando el cronómetro termina
  const handleTimerComplete = async () => {
    if (!selectedComplement || !session?.user?.id) return;

    try {
      // Solo permitir completar el complemento del día actual
      if (selectedComplement.dayOfWeek === currentDayOfWeek) {
        const response = await fetch('/api/user-interactions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ complement_id: selectedComplement.id }),
        });

        if (response.ok) {
          setCompletedComplements((prev) => new Set([...prev, selectedComplement.id]));
          // Cerrar modal después de un momento
          setTimeout(() => {
            setShowModal(false);
            setSelectedComplement(null);
            setTimerActive(false);
            setTimeRemaining(600);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error completing complement:', error);
    }
  };

  // Abrir modal al hacer click en un complemento
  const handleComplementClick = (complement: Complement) => {
    const availableComplements = getAvailableComplements();
    const complementData = availableComplements.find(c => c.id === complement.id);
    
    if (complementData?.isAvailable) {
      setSelectedComplement(complement);
      setShowModal(true);
      setTimeRemaining(600);
      setTimerActive(false);
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    if (timerActive) {
      if (confirm('¿Estás seguro de que quieres cerrar? El cronómetro se detendrá.')) {
        setTimerActive(false);
        setShowModal(false);
        setSelectedComplement(null);
        setTimeRemaining(600);
      }
    } else {
      setShowModal(false);
      setSelectedComplement(null);
      setTimeRemaining(600);
    }
  };

  // Navegar carrusel
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allComplements.length) % allComplements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allComplements.length);
  };

  const availableComplements = getAvailableComplements();
  const currentComplement = availableComplements[currentIndex];

  return (
    <>
      <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 min-h-0">
        {/* Header */}
        <div className="mb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-1">
            <Video className="w-4 h-4 text-[#85ea10]" />
            <span>Complementos Diarios</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Nuevo contenido todos los días
          </p>
        </div>

        {/* Carrusel de complementos */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="relative flex-1 min-h-0">
            {/* Botones de navegación */}
            {allComplements.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:scale-110 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:scale-110 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-900 dark:text-white" />
                </button>
              </>
            )}

            {/* Card del complemento actual */}
            {currentComplement && (
              <button
                onClick={() => handleComplementClick(currentComplement)}
                disabled={currentComplement.isDisabled && !currentComplement.isCompleted}
                className={`
                  relative w-full h-full rounded-xl overflow-hidden
                  transition-all duration-200
                  ${currentComplement.isCompleted 
                    ? 'bg-[#85ea10]/20 border-2 border-[#85ea10] cursor-default' 
                    : currentComplement.isToday
                      ? 'bg-gray-100 dark:bg-gray-700 border-2 border-[#85ea10] hover:scale-[1.02] cursor-pointer shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 cursor-pointer'
                  }
                `}
              >
                {/* Video thumbnail */}
                <video
                  src={currentComplement.video}
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${
                    currentComplement.isCompleted || currentComplement.isDisabled 
                      ? 'grayscale opacity-50' 
                      : ''
                  }`}
                />

                {/* Overlay con información */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {currentComplement.isToday && (
                          <div className="inline-flex items-center gap-1 bg-[#85ea10] rounded-full px-2 py-0.5 mb-1">
                            <span className="text-black text-[10px] font-bold uppercase">Hoy</span>
                          </div>
                        )}
                        <h4 className="text-base sm:text-lg font-bold text-white mb-0.5">
                          {currentComplement.dayName}
                        </h4>
                        <p className="text-white/90 text-xs">
                          {currentComplement.title}
                        </p>
                      </div>
                      {currentComplement.isCompleted ? (
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-[#85ea10] bg-white rounded-full flex-shrink-0" />
                      ) : currentComplement.isDisabled ? (
                        <div className="bg-gray-500/50 backdrop-blur-sm rounded-full p-2 sm:p-3 shadow-lg flex-shrink-0">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      ) : (
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 sm:p-3 shadow-2xl flex-shrink-0">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 ml-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Indicadores de posición */}
          <div className="flex justify-center gap-1.5 mt-3 flex-shrink-0">
            {allComplements.map((_, index) => {
              const complement = availableComplements[index];
              return (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? complement?.isToday
                        ? 'bg-[#85ea10] w-6'
                        : 'bg-gray-400 w-6'
                      : 'bg-gray-300 dark:bg-gray-600 w-1.5'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal con video y cronómetro */}
      {showModal && selectedComplement && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col lg:flex-row">
            {/* Botón cerrar */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:scale-110 transition-all"
            >
              <X className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>

            {/* Video explicativo */}
            <div className="flex-1 lg:w-1/2 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                src={selectedComplement.video}
                controls
                autoPlay
                className="w-1/2 h-1/2 max-h-[25vh] lg:max-h-[45vh] object-contain"
              />
            </div>

            {/* Cronómetro */}
            <div className="flex-1 lg:w-1/2 p-6 sm:p-8 flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedComplement.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedComplement.dayOfWeek === currentDayOfWeek 
                    ? 'Mira el video y luego inicia tu rutina de 10 minutos'
                    : 'Este es el complemento de otro día. Solo puedes completar el complemento del día actual.'}
                </p>
              </div>

              {/* Cronómetro grande */}
              <div className="relative">
                <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-8 border-[#85ea10] flex items-center justify-center bg-gradient-to-br from-[#85ea10]/10 to-[#7dd30f]/5">
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl font-black text-[#85ea10] mb-2">
                      {formatTime(timeRemaining)}
                    </div>
                    {timeRemaining === 0 && (
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ¡Completado!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controles del cronómetro */}
              {selectedComplement.dayOfWeek === currentDayOfWeek && (
                <div className="flex items-center gap-4">
                  {!timerActive && timeRemaining > 0 && (
                    <button
                      onClick={handleStartTimer}
                      className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>Iniciar</span>
                    </button>
                  )}

                  {timerActive && (
                    <button
                      onClick={handlePauseTimer}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                    >
                      <Clock className="w-5 h-5" />
                      <span>Pausar</span>
                    </button>
                  )}

                  {timeRemaining < 600 && (
                    <button
                      onClick={handleResetTimer}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Reiniciar
                    </button>
                  )}
                </div>
              )}

              {/* Mensaje de instrucciones */}
              {!timerActive && timeRemaining === 600 && selectedComplement.dayOfWeek === currentDayOfWeek && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                  Primero mira el video explicativo, luego presiona "Iniciar" para comenzar tu rutina de 10 minutos
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
