'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Complement {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  video_url?: string;
  is_new: boolean;
  duration: number;
  category: string;
  difficulty: string;
}

export default function ComplementSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [complements, setComplements] = useState<Complement[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcular cards por vista según el tamaño de pantalla
  const updateCardsPerView = () => {
    const width = window.innerWidth;
    if (width >= 1536) { // 2xl
      setCardsPerView(4);
    } else if (width >= 1024) { // lg
      setCardsPerView(3);
    } else if (width >= 768) { // md
      setCardsPerView(2);
    } else { // sm
      setCardsPerView(1);
    }
  };

  // Cargar complementos desde la API
  useEffect(() => {
    const fetchComplements = async () => {
      try {
        const response = await fetch('/api/complements');
        if (response.ok) {
          const data = await response.json();
          setComplements(data.complements || data);
        }
      } catch (error) {
        console.error('Error fetching complements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplements();
  }, []);

  // Actualizar cards por vista al cambiar el tamaño de pantalla
  React.useEffect(() => {
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(complements.length / cardsPerView));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(complements.length / cardsPerView)) % Math.ceil(complements.length / cardsPerView));
  };

  const visibleComplements = complements.slice(currentIndex * cardsPerView, (currentIndex + 1) * cardsPerView);

  if (loading) {
    return (
      <div className="mb-12">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center space-x-2 mb-2">
            <Sparkles className="w-6 h-6 text-[#85ea10]" />
            <span>Complementos</span>
          </h3>
          <p className="text-white/60 text-sm">
            Cargando contenido...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-2">
          <Sparkles className="w-6 h-6 text-[#85ea10]" />
          <span>Complementos</span>
        </h3>
        <p className="text-gray-600 dark:text-white/60 text-sm">
          Nuevo contenido diario
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative mx-0 md:mx-12 py-4">
        {/* Navigation Arrows - Posicionadas fuera del contenedor */}
        <button
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="absolute -left-12 top-1/2 transform -translate-y-1/2 z-10 bg-gray-900/50 dark:bg-black/50 hover:bg-gray-900/70 dark:hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm hidden md:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          disabled={currentIndex >= Math.ceil(complements.length / cardsPerView) - 1}
          className="absolute -right-12 top-1/2 transform -translate-y-1/2 z-10 bg-gray-900/50 dark:bg-black/50 hover:bg-gray-900/70 dark:hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm hidden md:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Cards Container - Centrado con padding para las flechas */}
        <div className="flex justify-center space-x-4 md:space-x-6 overflow-visible px-2">
          {visibleComplements.map((complement) => (
            <div
              key={complement.id}
              className={`flex-shrink-0 bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/15 hover:border-[#85ea10]/30 hover:scale-[1.02] hover:z-20 transition-all duration-300 ease-out cursor-pointer shadow-lg dark:shadow-none ${
                cardsPerView === 1 ? 'w-full max-w-lg mx-auto' :
                cardsPerView === 2 ? 'w-[28rem]' :
                cardsPerView === 3 ? 'w-96' :
                cardsPerView === 4 ? 'w-80' :
                cardsPerView === 5 ? 'w-72' :
                'w-64'
              }`}
              onClick={() => window.location.href = `/complement/${complement.id}`}
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-[9/16] bg-gradient-to-br from-[#85ea10]/20 to-[#7dd30f]/20">
                {/* Video */}
                <iframe 
                  src={complement.video_url || "https://player.vimeo.com/video/1120425801?badge=0&autopause=0&player_id=0&app_id=58479"} 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  title={complement.title}
                  className="w-full h-full rounded-t-2xl"
                ></iframe>

                {/* New Badge - Estilo RogerBox */}
                {complement.is_new && (
                  <div className="absolute top-3 left-3 bg-[#85ea10] text-black px-3 py-1.5 rounded-lg text-xs font-black tracking-wide shadow-lg border-2 border-black/20">
                    NUEVO
                  </div>
                )}
              </div>

              {/* Content - Minimalista */}
              <div className="p-4">
                <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2 line-clamp-1">
                  {complement.title}
                </h4>
                <p className="text-gray-600 dark:text-white/60 text-sm line-clamp-2">
                  {complement.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: Math.ceil(complements.length / cardsPerView) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-[#85ea10] w-8' 
                  : 'bg-gray-300 dark:bg-white/30 hover:bg-gray-400 dark:hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}