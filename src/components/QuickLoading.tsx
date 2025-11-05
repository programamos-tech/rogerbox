'use client';

import { useState, useEffect } from 'react';

interface QuickLoadingProps {
  message?: string;
  duration?: number; // en milisegundos
  onComplete?: () => void;
}

export default function QuickLoading({ 
  message = "Cargando...", 
  duration = 3000,
  onComplete
}: QuickLoadingProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        {/* Logo con efecto de pulso */}
        <div className="mb-12">
          <div className="relative">
            {/* Efecto de resplandor sutil */}
            <div className="absolute inset-0 bg-[#85ea10]/20 blur-2xl rounded-full scale-110 animate-pulse"></div>
            
            {/* Logo principal */}
            <h1 className="relative text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight animate-pulse uppercase">
              <span className="font-black">ROGER<span className="text-[#85ea10]">BOX</span></span>
            </h1>
          </div>
        </div>

        {/* Dots animados */}
        <div className="flex justify-center space-x-3 mb-8">
          <div className="w-3 h-3 bg-[#85ea10] rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-[#85ea10] rounded-full animate-bounce delay-200"></div>
          <div className="w-3 h-3 bg-[#85ea10] rounded-full animate-bounce delay-400"></div>
        </div>

        {/* Mensaje con efecto de escritura */}
        <p className="text-gray-600 dark:text-white/80 text-xl font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
