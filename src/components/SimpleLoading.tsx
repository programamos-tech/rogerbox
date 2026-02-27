'use client';

import { useState, useEffect } from 'react';

interface SimpleLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export default function SimpleLoading({ 
  message = "Cargando...", 
  size = 'md',
  showProgress = false
}: SimpleLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const loadingMessages = [
    "Cada repetición te acerca a tu meta",
    "Tu cuerpo puede hacerlo, tu mente debe creerlo",
    "La disciplina es el puente entre metas y logros",
    "El éxito es la suma de pequeños esfuerzos repetidos",
    "No esperes el momento perfecto, empieza ahora",
    "La transformación comienza con una decisión",
    "Eres más fuerte de lo que piensas"
  ];

  useEffect(() => {
    if (showProgress) {
      // Simular progreso suave
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 8;
        });
      }, 300);

      // Cambiar mensajes
      const messageInterval = setInterval(() => {
        setCurrentMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2000);

      return () => {
        clearInterval(interval);
        clearInterval(messageInterval);
      };
    }
  }, [showProgress]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo Simple */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            ROGER<span className="text-[#85ea10]">BOX</span>
          </h1>
        </div>

        {/* Spinner Simple */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-white/20 border-t-[#85ea10] rounded-full animate-spin mx-auto mb-6`}></div>

        {/* Mensaje Simple */}
        <p className="text-gray-600 dark:text-white/80 text-lg font-medium">
          {showProgress ? currentMessage : message}
        </p>
      </div>
    </div>
  );
}
