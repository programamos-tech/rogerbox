'use client';

import { useState, useEffect } from 'react';
import { appStore } from '@/lib/store';
import { User, Class, Reservation } from '@/types';
import { Calendar, Clock, Users, Zap, Plus, X } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CalendarModule() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      const state = appStore.getState();
      setCurrentUser(state.currentUser);
      setClasses(state.classes);
      setReservations(state.currentUser?.reservations || []);
    });

    const state = appStore.getState();
    setCurrentUser(state.currentUser);
    setClasses(state.classes);
    setReservations(state.currentUser?.reservations || []);

    return () => {
      unsubscribe();
    };
  }, []);

  if (!currentUser) return null;

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getClassesForDay = (day: Date) => {
    const dayOfWeek = day.getDay();
    return classes.filter(c => c.dayOfWeek === dayOfWeek);
  };

  const getReservationsForDay = (day: Date) => {
    return reservations.filter(r => 
      r.status === 'active' && 
      isSameDay(new Date(r.classDate), day)
    );
  };

  const canReserve = (classData: Class, classDate: Date) => {
    if (!currentUser.membership?.isActive) return false;
    
    // Check if already has a reservation for this day
    const dayReservations = getReservationsForDay(classDate);
    if (dayReservations.length > 0) return false;
    
    // Check if reservation is within 2 days
    const now = new Date();
    const daysDiff = Math.ceil((classDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 2) return false;
    
    // Check if class is in the past
    if (isBefore(classDate, now)) return false;
    
    // Check capacity
    const allReservations = appStore.getState().users
      .flatMap(u => u.reservations)
      .filter(r => r.classId === classData.id && r.status === 'active' && isSameDay(new Date(r.classDate), classDate));
    
    return allReservations.length < classData.capacity;
  };

  const handleReserve = (classData: Class, classDate: Date) => {
    if (!canReserve(classData, classDate)) return;
    
    const success = appStore.createReservation(currentUser.id, classData.id, classDate);
    if (success) {
      // Show success message
      alert('¡Clase reservada exitosamente!');
    } else {
      alert('No se pudo reservar la clase. Verifica que tengas membresía activa y que no hayas excedido los límites.');
    }
  };

  const handleCancelReservation = (reservationId: string) => {
    appStore.cancelReservation(reservationId);
    alert('Reserva cancelada exitosamente');
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-blue-500';
      case 'High': return 'bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getIntensityText = (intensity: string) => {
    switch (intensity) {
      case 'Low': return 'Baja';
      case 'Medium': return 'Media';
      case 'High': return 'Alta';
      default: return intensity;
    }
  };

  return (
    <div id="calendar" className="space-y-6">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-green-600" />
            <span>Calendario de Clases</span>
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-bold"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-bold"
            >
              Esta Semana
            </button>
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-bold"
            >
              →
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-bold text-gray-600 mb-1">
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className={`text-lg font-bold ${
                isSameDay(day, new Date()) ? 'text-green-600' : 'text-gray-800'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        

        {/* Classes Grid */}
        <div className="space-y-4">
          {weekDays.map((day, dayIndex) => {
            const dayClasses = getClassesForDay(day);
            const dayReservations = getReservationsForDay(day);
            
            return (
              <div key={dayIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {format(day, 'EEEE, d \'de\' MMMM', { locale: es })}
                  </h3>
                  <span className="text-sm text-gray-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                    {dayReservations.length} reserva{dayReservations.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {dayClasses.length === 0 ? (
                  <p className="text-gray-500 text-sm font-semibold">No hay clases programadas</p>
                ) : (
                  <div className="grid gap-3">
                    {dayClasses.map((classData) => {
                      const classDate = new Date(day);
                      const [hours, minutes] = classData.time.split(':');
                      classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      
                      const canReserveClass = canReserve(classData, classDate);
                      const userReservation = dayReservations.find(r => r.classId === classData.id);
                      const isReserved = !!userReservation;
                      
                      // Count total reservations for this class
                      const totalReservations = appStore.getState().users
                        .flatMap(u => u.reservations)
                        .filter(r => r.classId === classData.id && r.status === 'active' && isSameDay(new Date(r.classDate), classDate)).length;
                      
                      return (
                        <div key={classData.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-800 font-bold">{classData.time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-600 text-sm font-semibold">
                                  {totalReservations}/{classData.capacity}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Zap className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-600 text-sm font-semibold">{classData.duration}min</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`px-2 py-1 rounded-full text-xs font-bold ${getIntensityColor(classData.intensity)} text-white`}>
                                {getIntensityText(classData.intensity)}
                              </div>
                            </div>
                          </div>
                          
                          <h4 className="text-gray-800 font-bold mb-1 text-lg">{classData.name}</h4>
                          <p className="text-gray-600 text-sm mb-3 font-semibold">
                            Instructor: {classData.instructor}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">
                              {!currentUser.membership?.isActive ? (
                                <span className="text-red-500">Membresía requerida</span>
                              ) : !canReserveClass ? (
                                <span className="text-yellow-600">
                                  {isReserved ? 'Ya reservada' : 
                                   totalReservations >= classData.capacity ? 'Cupo lleno' :
                                   'No disponible'}
                                </span>
                              ) : (
                                <span className="text-green-600">Disponible</span>
                              )}
                            </div>
                            
                            {isReserved ? (
                              <button
                                onClick={() => handleCancelReservation(userReservation!.id)}
                                className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-bold"
                              >
                                <X className="w-4 h-4" />
                                <span>Cancelar</span>
                              </button>
                            ) : canReserveClass ? (
                              <button
                                onClick={() => handleReserve(classData, classDate)}
                                className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-bold"
                              >
                                <Plus className="w-4 h-4" />
                                <span>💪 Reservar</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="flex items-center space-x-1 px-3 py-2 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed text-sm font-bold"
                              >
                                <Plus className="w-4 h-4" />
                                <span>No disponible</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
