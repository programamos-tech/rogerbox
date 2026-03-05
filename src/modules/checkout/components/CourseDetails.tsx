import { Clock, Play, Star, Users } from 'lucide-react';
import type { Course, Lesson } from '../types';

interface CourseDetailsProps {
  course: Course;
  lessons: Lesson[];
}

export default function CourseDetails({ course, lessons }: CourseDetailsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
        {course.title}
      </h1>

      {/* Descripción */}
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        {course.description ||
          course.short_description ||
          'Transforma tu cuerpo con este programa intensivo de entrenamiento diseñado para quemar grasa y tonificar músculos.'}
      </p>

      {/* Stats en badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
          <Clock className="w-4 h-4 text-[#85ea10]" />
          {course.duration || '8 semanas'}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          {course.rating || '4.8'}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
          <Users className="w-4 h-4 text-[#85ea10]" />
          {course.students_count || 0} estudiantes
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#85ea10]/10 rounded-full text-sm text-[#85ea10] font-medium">
          <Play className="w-4 h-4" />
          {lessons.length} clases
        </span>
      </div>
    </div>
  );
}
