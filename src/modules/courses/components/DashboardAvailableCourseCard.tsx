'use client';

import { Clock, Play, ShoppingCart, Star, Users, Zap } from 'lucide-react';
import type { UnifiedCourse } from '@/services/unifiedCoursesService';

export type DashboardAvailableCourseCardProps = {
  course: UnifiedCourse;
  purchased: boolean;
  categoryLabel: string;
  durationLabel: string;
  finalPrice: number;
  originalPrice: number;
  onOpenCourse: () => void;
  onOpenStudent: () => void;
};

export function DashboardAvailableCourseCard({
  course,
  purchased,
  categoryLabel,
  durationLabel,
  finalPrice,
  originalPrice,
  onOpenCourse,
  onOpenStudent,
}: DashboardAvailableCourseCardProps) {
  const discount = course.discount_percentage ?? 0;

  return (
    <div
      onClick={onOpenCourse}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenCourse();
        }
      }}
      role="button"
      tabIndex={0}
      className="flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-700/20 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 rounded-2xl cursor-pointer w-full overflow-hidden"
    >
      <div className="w-full relative aspect-video overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
        <img
          src={
            course.thumbnail ||
            course.preview_image ||
            '/images/course-placeholder.jpg'
          }
          alt={course.title}
          className="w-full h-full object-contain rounded-t-2xl"
          style={{
            objectPosition: 'center center',
            display: 'block',
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src?.endsWith('course-placeholder.jpg')) {
              target.src = '/images/course-placeholder.jpg';
            }
          }}
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 z-10 pointer-events-none">
          <Play
            className="w-14 h-14 sm:w-16 sm:h-16 text-white drop-shadow-lg"
            fill="currentColor"
          />
        </div>
        <div className="absolute top-3 left-3 sm:left-4 flex gap-2 z-20">
          {course.isPopular && (
            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              POPULAR
            </div>
          )}
          {course.isNew && (
            <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              NUEVO
            </div>
          )}
        </div>
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full z-10">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
          <span className="text-xs sm:text-sm font-semibold">
            {course.rating || '4.8'}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-visible p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-1.5 sm:gap-2 mb-3">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white break-words leading-tight line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-white/80 leading-relaxed break-words line-clamp-2 sm:line-clamp-3">
            {course.short_description || course.description}
          </p>
          <div className="flex justify-start sm:justify-center w-full">
            <span className="inline-flex items-center justify-center px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
              {categoryLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-start sm:justify-center gap-x-2 gap-y-1 sm:gap-3 mb-2 sm:mb-3 min-h-[1.25rem]">
            <div className="flex items-center gap-1 flex-shrink-0">
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                {course.lessons_count || 0} clases
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                {durationLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                {course.students_count || 0} est.
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                <span className="md:hidden">
                  {course.level === 'Principiante'
                    ? 'Princ.'
                    : course.level === 'Intermedio'
                      ? 'Inter.'
                      : course.level === 'Avanzado'
                        ? 'Avanz.'
                        : course.level || 'Todos'}
                </span>
                <span className="hidden md:inline">
                  {course.level || 'Todos'}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          {purchased ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenStudent();
              }}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              <span>Entrar al curso</span>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {discount > 0 ? (
                  <>
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      ${finalPrice.toLocaleString('es-CO')}
                    </span>
                    <span className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-white/50 line-through">
                      ${originalPrice.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-white font-bold bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg">
                      {discount}% de descuento
                    </span>
                  </>
                ) : (
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    ${finalPrice.toLocaleString('es-CO')}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCourse();
                }}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>¡Comenzar Ahora!</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
