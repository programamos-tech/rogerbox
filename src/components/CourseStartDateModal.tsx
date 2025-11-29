'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CourseStartDateModalProps {
  courseId: string;
  orderId: string;
  onClose?: () => void;
}

export default function CourseStartDateModal({ courseId, orderId, onClose }: CourseStartDateModalProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState<string>('');

  useEffect(() => {
    // Fecha mínima es hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setMinDate(today.toISOString().split('T')[0]);
    // Por defecto, seleccionar hoy
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async () => {
    if (!selectedDate) {
      setError('Por favor selecciona una fecha de inicio');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Actualizar la compra con la fecha de inicio
      const { data: purchase, error: purchaseError } = await supabase
        .from('course_purchases')
        .select('id')
        .eq('order_id', orderId)
        .eq('course_id', courseId)
        .single();

      if (purchaseError || !purchase) {
        throw new Error('No se encontró la compra del curso');
      }

      // Actualizar la fecha de inicio del curso
      const { error: updateError } = await supabase
        .from('course_purchases')
        .update({
          start_date: selectedDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchase.id);

      if (updateError) {
        throw updateError;
      }

      // Redirigir al dashboard del estudiante
      router.push('/student');
    } catch (err: any) {
      console.error('Error setting start date:', err);
      setError(err.message || 'Error al guardar la fecha de inicio');
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Selecciona tu Fecha de Inicio
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Elige cuándo quieres comenzar tu curso
          </p>
        </div>

        {/* Información importante */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                ⚠️ Importante: Cómo funciona tu curso
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Desde la fecha que elijas</strong>, comenzarán a desbloquearse las clases.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Cada día se habilitará una nueva clase</strong> para que puedas tomarla.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Si no tomas la clase del día, se pierde</strong> y deberás tomar la siguiente clase disponible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Mantén la <strong>constancia</strong> para no perderte ninguna clase.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Selector de fecha */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Fecha de inicio del curso:
          </label>
          <input
            type="date"
            value={selectedDate}
            min={minDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85ea10] dark:bg-gray-700 dark:text-white text-xl font-medium cursor-pointer"
            style={{ fontSize: '1.25rem', padding: '1.25rem 1.5rem', minHeight: '60px' }}
            required
          />
          {selectedDate && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Iniciarás el curso el: <strong className="text-[#85ea10]">{formatDate(selectedDate)}</strong>
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Botón de confirmar */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedDate}
          className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg text-lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Fecha de Inicio
            </>
          )}
        </button>

        {/* Nota adicional */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          Puedes cambiar la fecha de inicio antes de comenzar, pero una vez que empieces, no podrás modificarla.
        </p>
      </div>
    </div>
  );
}

