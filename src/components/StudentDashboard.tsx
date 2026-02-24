'use client';

import { endOfWeek, startOfWeek } from 'date-fns';
import {
  Calendar,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Star,
  Target,
  Trophy,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { appStore } from '@/lib/store';
import type { Class, User } from '@/types';

interface StudentDashboardProps {
  user: User;
  onBack: () => void;
}

export default function StudentDashboard({
  user,
  onBack,
}: StudentDashboardProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      const state = appStore.getState();
      setClasses(state.classes);
    });

    const state = appStore.getState();
    setClasses(state.classes);

    return () => {
      unsubscribe();
    };
  }, []);

  const hasActiveMembership = user.membership?.isActive;

  const getWeekClasses = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

    return (
      classes?.filter((cls) => {
        const classDate = new Date();
        classDate.setDate(weekStart.getDate() + (cls.dayOfWeek - 1));
        return classDate >= weekStart && classDate <= weekEnd;
      }) || []
    );
  };

  const getUserReservations = () => {
    return [];
  };

  const getUpcomingEvents = () => {
    return [];
  };

  const getAttendanceStreak = () => {
    // Simular racha de asistencia (en una app real vendría de la base de datos)
    return Math.floor(Math.random() * 30) + 1;
  };

  const getCaloriesBurned = () => {
    // Simular calorías quemadas esta semana
    return Math.floor(Math.random() * 2000) + 500;
  };

  const handleReserveClass = (classId: string) => {
    const classToReserve = classes?.find((c) => c.id === classId);
    if (!classToReserve) return;

    alert('¡Clase reservada exitosamente!');
  };

  const handlePayment = () => {
    setIsProcessingPayment(true);
    // Simular redirección a Wompy
    window.open('https://wompi.co', '_blank');

    // Simular activación de membresía después de 2 segundos
    setTimeout(() => {
      // Activar membresía del usuario
      appStore.activateMembership(user.id);
      setShowPayment(false);
      setIsProcessingPayment(false);
      alert(
        '¡Membresía activada exitosamente! Ya puedes acceder a todas las funciones de RogerBox.',
      );
    }, 2000);
  };

  if (!hasActiveMembership) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-white hover:text-[#85ea10] transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span className="font-semibold">Volver</span>
            </button>
            <h1 className="text-3xl font-black text-white">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
          </div>

          {/* Membership Banner */}
          <div className="bg-gradient-to-r from-[#85ea10]/90 to-[#7dd30f]/90 rounded-2xl p-8 mb-8 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">
              Activa tu Membresía
            </h2>
            <p className="text-black text-lg mb-6">
              Accede a todas las funciones de RogerBox
            </p>

            <div className="bg-black/20 rounded-xl p-6 mb-6 max-w-lg mx-auto">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <p className="text-black text-sm font-medium">
                    Precio Normal
                  </p>
                  <p className="text-black text-xl font-bold line-through">
                    $200,000
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-black text-sm font-medium">Tu Precio</p>
                  <p className="text-black text-3xl font-bold">$135,000</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              className="bg-black text-[#85ea10] px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
            >
              Activar Ahora
            </button>
          </div>

          {/* Success Stats */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white text-center mb-6">
              Resultados Comprobados
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">95%</span>
                </div>
                <p className="text-white text-sm font-medium">Satisfacción</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">-8kg</span>
                </div>
                <p className="text-white text-sm font-medium">Promedio</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">500+</span>
                </div>
                <p className="text-white text-sm font-medium">Estudiantes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#85ea10] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">3x</span>
                </div>
                <p className="text-white text-sm font-medium">Más Rápido</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white text-center mb-6">
              Lo que dicen nuestros estudiantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#85ea10]/20 border border-[#85ea10] rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-[#85ea10] rounded-full flex items-center justify-center mr-3">
                    <span className="text-black font-bold text-sm">M</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">María G.</h4>
                    <div className="flex text-[#85ea10]">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-white text-xs italic">
                  "Perdí 12kg en 2 meses. ¡Roger es increíble!"
                </p>
              </div>

              <div className="bg-[#85ea10]/20 border border-[#85ea10] rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-[#85ea10] rounded-full flex items-center justify-center mr-3">
                    <span className="text-black font-bold text-sm">C</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Carlos R.</h4>
                    <div className="flex text-[#85ea10]">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-white text-xs italic">
                  "Ahora es mi rutina favorita. Excelente calidad."
                </p>
              </div>

              <div className="bg-[#85ea10]/20 border border-[#85ea10] rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-[#85ea10] rounded-full flex items-center justify-center mr-3">
                    <span className="text-black font-bold text-sm">A</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Ana M.</h4>
                    <div className="flex text-[#85ea10]">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-white text-xs italic">
                  "La mejor inversión. ¡Gracias RogerBox!"
                </p>
              </div>
            </div>
          </div>

          {/* Membership Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Card 1 - Clases Diarias */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-[#85ea10] transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#85ea10] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Clases Diarias
                </h3>
                <p className="text-white text-sm mb-4">
                  Clases HIIT todos los días, una hora de entrenamiento intenso.
                </p>
                <div className="bg-[#85ea10]/20 rounded-xl p-3">
                  <p className="text-[#85ea10] font-bold">$135,000/mes</p>
                </div>
              </div>
            </div>

            {/* Card 2 - Clases Virtuales */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-[#85ea10] transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#85ea10] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Video className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Clases Virtuales
                </h3>
                <p className="text-white text-sm mb-4">
                  Video llamadas en vivo desde casa cuando no puedas asistir.
                </p>
                <div className="bg-[#85ea10]/20 rounded-xl p-3">
                  <p className="text-[#85ea10] font-bold">Incluido</p>
                </div>
              </div>
            </div>

            {/* Card 3 - Materiales */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-[#85ea10] transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#85ea10] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Dumbbell className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Materiales
                </h3>
                <p className="text-white text-sm mb-4">
                  Pesas, colchonetas y todo el equipo necesario para entrenar.
                </p>
                <div className="bg-[#85ea10]/20 rounded-xl p-3">
                  <p className="text-[#85ea10] font-bold">Incluido</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-black/90 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20">
                <h3 className="text-2xl font-black text-white mb-6 text-center">
                  PAGO CON WOMPY
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-white font-bold text-lg">
                      Membresía RogerBox
                    </p>
                    <p className="text-[#85ea10] font-black text-2xl">
                      $135,000 COP
                    </p>
                  </div>
                  <div className="text-white text-sm space-y-2">
                    <p>✓ Clases diarias de HIIT</p>
                    <p>✓ Acceso a clases virtuales</p>
                    <p>✓ Materiales de entrenamiento</p>
                    <p>✓ Seguimiento personalizado</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowPayment(false)}
                    disabled={isProcessingPayment}
                    className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors font-bold disabled:cursor-not-allowed"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    className="flex-1 py-3 px-6 bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-gray-600 text-black disabled:text-gray-400 rounded-lg transition-colors font-bold disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>PROCESANDO...</span>
                      </>
                    ) : (
                      <span>PAGAR CON WOMPY</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard para usuarios con membresía activa
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-white hover:text-[#85ea10] transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span className="font-semibold">Volver</span>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
            <p className="text-white text-lg">¡Bienvenido, {user.name}!</p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">RACHA ACTUAL</p>
                <p className="text-2xl font-black text-white">
                  {getAttendanceStreak()} días
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                <Flame className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  CALORÍAS ESTA SEMANA
                </p>
                <p className="text-2xl font-black text-white">
                  {getCaloriesBurned()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  CLASES RESERVADAS
                </p>
                <p className="text-2xl font-black text-white">
                  {getUserReservations().length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  OBJETIVO SEMANAL
                </p>
                <p className="text-2xl font-black text-white">5 clases</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center">
                <CalendarIcon className="w-6 h-6 text-[#85ea10] mr-3" />
                CALENDARIO DE CLASES
              </h2>

              <div className="grid grid-cols-7 gap-2 mb-6">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(
                  (day, _index) => (
                    <div
                      key={day}
                      className="text-center text-white font-bold py-2"
                    >
                      {day}
                    </div>
                  ),
                )}
                {getWeekClasses().map((cls, _index) => (
                  <div
                    key={cls.id}
                    className="bg-[#85ea10]/20 border border-[#85ea10] rounded-lg p-3 text-center"
                  >
                    <p className="text-white font-bold text-sm">{cls.time}</p>
                    <p className="text-[#85ea10] text-xs">{cls.name}</p>
                    <p className="text-white text-xs">{cls.duration}min</p>
                    <button
                      onClick={() => handleReserveClass(cls.id)}
                      className="mt-2 bg-[#85ea10] text-black px-2 py-1 rounded text-xs font-bold hover:bg-[#7dd30f] transition-colors"
                    >
                      RESERVAR
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center">
                <Clock className="w-6 h-6 text-[#85ea10] mr-3" />
                PRÓXIMOS EVENTOS
              </h2>

              <div className="space-y-4">
                {getUpcomingEvents().length === 0 ? (
                  <p className="text-white text-center py-8">
                    No tienes clases reservadas
                  </p>
                ) : (
                  <div className="text-center text-white/60 py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-[#85ea10]" />
                    <p>No hay clases próximas programadas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
