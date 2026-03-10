'use client';

import {
  addDays,
  addMonths,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { supabase } from '@/lib/supabase';

interface CourseStartDateModalProps {
  courseId: string;
  orderId?: string | null; // Opcional: puede ser null si viene de searchParams
  purchaseId?: string; // Opcional: si se pasa, se usa directamente sin buscar
  onClose?: () => void;
}

export default function CourseStartDateModal({
  courseId,
  orderId,
  purchaseId,
  onClose,
}: CourseStartDateModalProps) {
  const router = useRouter();
  const { refresh: refreshPurchases } = useUserPurchases();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState<string>('');
  const [viewMonth, setViewMonth] = useState(() => new Date());

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setMinDate(today.toISOString().split('T')[0]);
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  const minDateObj = useMemo(() => {
    if (!minDate) return null;
    const [y, m, d] = minDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [minDate]);

  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = addDays(start, 41);
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [viewMonth]);

  const handleSubmit = async () => {
    if (!selectedDate) {
      setError('Por favor selecciona una fecha de inicio');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let purchaseIdToUse = purchaseId;

      // Si no se pasó purchaseId, buscarlo
      if (!purchaseIdToUse) {
        if (!orderId) {
          setError('No se pudo identificar la orden de compra');
          setIsSubmitting(false);
          return;
        }

        // Buscar la compra del curso
        const { data: purchase, error: purchaseError } = await supabase
          .from('course_purchases')
          .select('id, order_id, course_id, user_id')
          .eq('order_id', orderId)
          .eq('course_id', courseId)
          .maybeSingle();

        if (purchaseError && purchaseError.code !== 'PGRST116') {
          throw new Error(
            `Error al buscar la compra: ${purchaseError.message}`,
          );
        }

        if (!purchase) {
          throw new Error(
            'No se encontró la compra del curso. Por favor, recarga la página o contacta al soporte.',
          );
        }

        purchaseIdToUse = purchase.id;
      } else {
      }

      // Actualizar la fecha de inicio del curso
      const { error: updateError } = await supabase
        .from('course_purchases')
        .update({
          start_date: selectedDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', purchaseIdToUse);

      if (updateError) {
        throw updateError;
      }

      // Refrescar las compras antes de redirigir
      await refreshPurchases();
      // Redirigir al dashboard del estudiante
      router.push('/student');
    } catch (err: any) {
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
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 max-w-lg w-full max-h-[95vh] overflow-y-auto">
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

        {/* Header - limpio */}
        <div className="text-center mb-4 pt-1">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-0.5">
            Selecciona tu Fecha de Inicio
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Elige cuándo quieres comenzar tu curso
          </p>
          <div className="mt-3 h-px bg-gray-100 dark:bg-gray-700" />
        </div>

        {/* Información - compacta */}
        <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm">
                Cómo funciona tu curso
              </h3>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Desde la fecha que elijas</strong>, comenzarán a
                    desbloquearse las clases.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Cada día se habilitará una nueva clase</strong> para
                    que puedas tomarla.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Si no tomas la clase del día, se pierde</strong> y
                    deberás tomar la siguiente clase disponible.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#85ea10] mt-0.5 flex-shrink-0" />
                  <span>
                    Mantén la <strong>constancia</strong> para no perderte
                    ninguna clase.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Calendario RogerBox - compacto, sin scroll */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha de inicio del curso
          </label>
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-700/30">
            {/* Header mes / año */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-900 dark:text-white capitalize">
                {viewMonth
                  .toLocaleDateString('es-CO', {
                    month: 'long',
                    year: 'numeric',
                  })
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-600">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Grid de días - altura fija para no crecer y evitar scroll */}
            <div className="grid grid-cols-7 p-1.5 gap-px">
              {calendarDays.map((day) => {
                const isDisabled = minDateObj && isBefore(day, minDateObj);
                const selected =
                  selectedDateObj && isSameDay(day, selectedDateObj);
                const today = isToday(day);
                const otherMonth = !isSameMonth(day, viewMonth);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      setSelectedDate(format(day, 'yyyy-MM-dd'));
                    }}
                    className={`
                      h-8 flex items-center justify-center text-xs rounded-lg transition-colors
                      ${otherMonth ? 'text-gray-300 dark:text-gray-500' : 'text-gray-900 dark:text-white'}
                      ${selected ? 'ring-2 ring-[#85ea10] bg-[#85ea10]/10 text-gray-900 dark:text-white font-semibold' : ''}
                      ${!selected && today && !otherMonth ? 'ring-2 ring-gray-300 dark:ring-gray-500' : ''}
                      ${!selected && !today && !otherMonth && !isDisabled ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : ''}
                      ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
            {/* Acciones */}
            <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-700/30">
              <button
                type="button"
                onClick={() => {
                  if (minDateObj)
                    setSelectedDate(format(minDateObj, 'yyyy-MM-dd'));
                  setViewMonth(minDateObj || new Date());
                }}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Hoy
              </button>
              {selectedDate && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                  {formatDate(selectedDate)}
                </span>
              )}
            </div>
          </div>
          {selectedDate && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Iniciarás el curso el:{' '}
              <strong className="text-gray-900 dark:text-white">
                {formatDate(selectedDate)}
              </strong>
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Botón - estilo landing con toque verde sutil */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedDate}
          className="w-full py-3.5 px-6 rounded-xl border-2 border-gray-900 dark:border-white border-l-[#85ea10] dark:border-l-[#85ea10] bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-gray-900 border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Confirmar Fecha de Inicio
            </>
          )}
        </button>

        {/* Nota adicional */}
        <p className="mt-3 text-[10px] text-center text-gray-500 dark:text-gray-400">
          Puedes cambiar la fecha de inicio antes de comenzar, pero una vez que
          empieces, no podrás modificarla.
        </p>
      </div>
    </div>
  );
}
