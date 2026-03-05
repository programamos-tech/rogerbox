import { CheckCircle, Lock, Play } from 'lucide-react';
import type { Lesson } from '../types';

interface CourseCurriculumProps {
  lessons: Lesson[];
}

export default function CourseCurriculum({ lessons }: CourseCurriculumProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
        Contenido del programa
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {lessons.length} clases • Cada día se desbloquea una nueva
      </p>
      <div className="space-y-3">
        {lessons.slice(0, 5).map((lesson, i) => {
          const isFirst = i === 0;
          const daysUntilUnlock = i;

          return (
            <div
              key={lesson.id}
              className={`flex gap-3 p-3 rounded-lg border transition-all ${
                isFirst
                  ? 'bg-[#85ea10]/10 border-[#85ea10]/30'
                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 opacity-60'
              }`}
            >
              {/* Thumbnail */}
              <div
                className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ${!isFirst ? 'grayscale' : ''}`}
              >
                {lesson.preview_image ? (
                  <img
                    src={lesson.preview_image}
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <Play className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                {!isFirst && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${isFirst ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {lesson.title}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {lesson.duration_minutes}m
                  </span>
                </div>

                {lesson.description && (
                  <p
                    className={`text-xs mt-0.5 line-clamp-1 ${isFirst ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}
                  >
                    {lesson.description}
                  </p>
                )}

                {/* Estado */}
                <div className="mt-1 flex items-center gap-1">
                  {isFirst ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-[#85ea10]" />
                      <span className="text-xs text-[#85ea10] font-medium">
                        Disponible hoy
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        Se habilita en {daysUntilUnlock}{' '}
                        {daysUntilUnlock === 1 ? 'día' : 'días'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {lessons.length > 5 && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
            + {lessons.length - 5} clases más...
          </p>
        )}
      </div>
    </div>
  );
}
