'use client';

import { Play, Star, Clock, Users, Zap } from 'lucide-react';

interface CourseLoadingSkeletonProps {
  count?: number;
  showRecommended?: boolean;
}

export default function CourseLoadingSkeleton({ 
  count = 3, 
  showRecommended = false 
}: CourseLoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-pulse"
        >
          {/* Imagen placeholder */}
          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          
          <div className="p-6">
            {/* Título */}
            <div className="space-y-2 mb-3">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            </div>
            
            {/* Descripción */}
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
            </div>
            
            {/* Cuadro verde placeholder */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              {/* Categoría */}
              <div className="flex justify-center mb-2">
                <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </div>
              
              {/* Mensaje motivacional */}
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Zap className="w-4 h-4 text-gray-400" />
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
              
              {/* Estadísticas */}
              <div className="flex justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-gray-400" />
                  <div className="h-3 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <Play className="w-3 h-3 text-gray-400" />
                  <div className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <div className="h-3 w-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <div className="h-3 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Precio y botón */}
            <div className="space-y-3">
              <div className="text-center">
                <div className="h-8 w-24 bg-gray-300 dark:bg-gray-600 rounded mx-auto animate-pulse"></div>
              </div>
              
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
