'use client';

import { Calendar, CheckCircle, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';

interface CourseStartCalendarProps {
  course: {
    id: string;
    title: string;
    duration_days: number;
  };
  onStartDateSelected: (startDate: string) => void;
  onCancel: () => void;
}

export default function CourseStartCalendar({
  course,
  onStartDateSelected,
  onCancel,
}: CourseStartCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generar fechas disponibles (próximos 30 días)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Solo días de lunes a viernes (días hábiles)
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        dates.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      }
    }

    return dates;
  };

  const availableDates = getAvailableDates();

  const handleSubmit = async () => {
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      await onStartDateSelected(selectedDate);
    } catch (error) {
      console.error('Error seleccionando fecha:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ¡Elige tu fecha de inicio!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Selecciona cuándo quieres comenzar tu curso
              </p>
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-[#85ea10] rounded-xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-black" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration_days} días de clases</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Una clase por día hábil</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selecciona tu fecha de inicio:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {availableDates.map((dateOption) => (
              <button
                key={dateOption.date}
                onClick={() => setSelectedDate(dateOption.date)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedDate === dateOption.date
                    ? 'border-[#85ea10] bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white capitalize">
                  {dateOption.display}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Día hábil
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">
                📅 CÓMO FUNCIONA TU CURSO
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Al elegir tu fecha de inicio, cada día hábil se desbloqueará una
                nueva clase. ¡Mantén la constancia para no perderte ninguna!
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDate || isSubmitting}
            className="flex-1 bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Configurando...</span>
              </>
            ) : (
              <>
                <span>¡Comenzar Curso!</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
