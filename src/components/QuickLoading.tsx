'use client';

import { useState, useEffect } from 'react';

interface QuickLoadingProps {
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

export default function QuickLoading({ 
  duration = 4500,
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Logo pequeño y minimalista */}
        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-4">
          ROGER<span className="text-[#85ea10]">BOX</span>
        </h1>

        {/* 3 puntitos cute animados */}
        <div className="flex justify-center space-x-1">
          <div 
            className="w-1.5 h-1.5 bg-[#85ea10] rounded-full animate-pulse"
            style={{ animationDelay: '0ms', animationDuration: '600ms' }}
          />
          <div 
            className="w-1.5 h-1.5 bg-[#85ea10] rounded-full animate-pulse"
            style={{ animationDelay: '200ms', animationDuration: '600ms' }}
          />
          <div 
            className="w-1.5 h-1.5 bg-[#85ea10] rounded-full animate-pulse"
            style={{ animationDelay: '400ms', animationDuration: '600ms' }}
          />
        </div>
      </div>
    </div>
  );
}
