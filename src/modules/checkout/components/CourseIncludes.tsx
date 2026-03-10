import { CheckCircle } from 'lucide-react';

interface CourseIncludesProps {
  lessonsCount: number;
  duration?: string;
}

export default function CourseIncludes({
  lessonsCount,
  duration,
}: CourseIncludesProps) {
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
          <span>Acceso por {duration || '8 semanas'}</span>
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
