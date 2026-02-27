'use client';

import { useState, useEffect } from 'react';
import { appStore } from '@/lib/store';
import { User, Reservation, Class } from '@/types';
import { QrCode, CheckCircle, Clock, Flame, Calendar } from 'lucide-react';
import { format, isAfter, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AttendanceModule() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCalories, setLastCalories] = useState(0);

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

  const getUpcomingReservations = () => {
    const now = new Date();
    return reservations
      .filter(r => r.status === 'active' && isAfter(new Date(r.classDate), now))
      .sort((a, b) => new Date(a.classDate).getTime() - new Date(b.classDate).getTime());
  };

  const getClassData = (classId: string) => {
    return classes.find(c => c.id === classId);
  };

  const handleQRScan = (reservation: Reservation) => {
    setIsScanning(true);
    
    // Simulate QR scanning process
    setTimeout(() => {
      const classData = getClassData(reservation.classId);
      if (!classData) return;
      
      const result = appStore.confirmAttendance(
        currentUser.id,
        reservation.classId,
        new Date(reservation.classDate)
      );
      
      if (result && typeof result === 'object' && 'caloriesBurned' in result) {
        setLastCalories(result.caloriesBurned);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
      
      setIsScanning(false);
    }, 2000);
  };

  const upcomingReservations = getUpcomingReservations();

  return (
    <div id="attendance" className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2 mb-6">
          <QrCode className="w-6 h-6" />
          <span>Asistencia con QR</span>
        </h2>

        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium text-green-300">¡Asistencia registrada!</span>
            </div>
            <p className="text-green-200 text-sm">
              Has quemado aproximadamente <span className="font-bold">{lastCalories} calorías</span> en esta clase.
            </p>
          </div>
        )}

        {upcomingReservations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No tienes clases reservadas</h3>
            <p className="text-gray-300 text-sm">
              Reserva una clase en el calendario para poder registrar tu asistencia.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">
              Clases Próximas ({upcomingReservations.length})
            </h3>
            
            {upcomingReservations.map((reservation) => {
              const classData = getClassData(reservation.classId);
              if (!classData) return null;
              
              const classDate = new Date(reservation.classDate);
              const [hours, minutes] = classData.time.split(':');
              classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              
              const isToday = isSameDay(classDate, new Date());
              const isTomorrow = isSameDay(classDate, new Date(Date.now() + 24 * 60 * 60 * 1000));
              
              return (
                <div key={reservation.id} className="bg-white/5 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{classData.name}</h4>
                      <p className="text-gray-300 text-sm">
                        {format(classDate, 'EEEE, d \'de\' MMMM \'a las\' HH:mm', { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-300" />
                      <span className="text-gray-300 text-sm">{classData.duration}min</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-gray-300 text-sm">
                          Intensidad: {classData.intensity === 'Low' ? 'Baja' : 
                                     classData.intensity === 'Medium' ? 'Media' : 'Alta'}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm">
                        Instructor: {classData.instructor}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleQRScan(reservation)}
                      disabled={isScanning}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        isScanning
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isScanning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300/30 border-t-gray-300 rounded-full animate-spin" />
                          <span>Escaneando...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>Escanear QR (Demo)</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {(isToday || isTomorrow) && (
                    <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded text-green-200 text-sm">
                      {isToday ? '¡Hoy es tu clase!' : '¡Mañana es tu clase!'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
