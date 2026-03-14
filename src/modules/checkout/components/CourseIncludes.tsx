import { CheckCircle } from 'lucide-react';

function getDurationFallback(lessonsCount: number): string {
  if (lessonsCount === 0) return 'según contenido';
  if (lessonsCount === 1) return '1 día';
  if (lessonsCount <= 7) return `${lessonsCount} días`;
  const weeks = Math.ceil(lessonsCount / 7);
  return weeks === 1 ? '1 semana' : `${weeks} semanas`;
}

interface CourseIncludesProps {
  lessonsCount: number;
  duration?: string;
}

export default function CourseIncludes({
  lessonsCount,
  duration,
}: CourseIncludesProps) {
  const durationText = duration?.trim()
    ? duration
    : getDurationFallback(lessonsCount);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">
        Lo que incluye este curso
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CheckCircle className="w-5 h-5 text-[#85ea10]/70 dark:text-[#85ea10]/80 flex-shrink-0" />
          <span>{lessonsCount} clases en video HD</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CheckCircle className="w-5 h-5 text-[#85ea10]/70 dark:text-[#85ea10]/80 flex-shrink-0" />
          <span>Acceso por {durationText}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CheckCircle className="w-5 h-5 text-[#85ea10]/70 dark:text-[#85ea10]/80 flex-shrink-0" />
          <span>Seguimiento de progreso</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CheckCircle className="w-5 h-5 text-[#85ea10]/70 dark:text-[#85ea10]/80 flex-shrink-0" />
          <span>Ejercicios paso a paso</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CheckCircle className="w-5 h-5 text-[#85ea10]/70 dark:text-[#85ea10]/80 flex-shrink-0" />
          <span>Entrena donde quieras</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CheckCircle className="w-5 h-5 text-[#85ea10]/70 dark:text-[#85ea10]/80 flex-shrink-0" />
          <span>Sin equipos especiales</span>
        </div>
      </div>
    </div>
  );
}
