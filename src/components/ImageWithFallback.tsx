'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackColor?: string;
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'IMAGE',
  fallbackColor = '4F46E5'
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = () => {
    setImageError(true);
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  if (imageError) {
    return (
      <div 
        className={`bg-gradient-to-br from-${fallbackColor}-500 to-${fallbackColor}-600 flex items-center justify-center text-white font-bold ${className}`}
        style={{ 
          background: `linear-gradient(135deg, #${fallbackColor}, #${fallbackColor}CC)`,
          minHeight: '100%'
        }}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🏋️</div>
          <div className="text-sm">{fallbackText}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}
