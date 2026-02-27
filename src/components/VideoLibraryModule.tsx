'use client';

import { useState, useEffect } from 'react';
import { appStore } from '@/lib/store';
import { User, Video, VideoPurchase } from '@/types';
import { Play, ShoppingCart, Clock, Star, CreditCard, Download } from 'lucide-react';

export default function VideoLibraryModule() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoPurchases, setVideoPurchases] = useState<VideoPurchase[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      const state = appStore.getState();
      setCurrentUser(state.currentUser);
      setVideos(state.videos);
      setVideoPurchases(state.currentUser?.videoPurchases || []);
    });

    const state = appStore.getState();
    setCurrentUser(state.currentUser);
    setVideos(state.videos);
    setVideoPurchases(state.currentUser?.videoPurchases || []);

    return () => {
      unsubscribe();
    };
  }, []);

  if (!currentUser) return null;

  const isVideoPurchased = (videoId: string) => {
    return videoPurchases.some(purchase => purchase.videoId === videoId);
  };

  const handlePurchaseVideo = async (video: Video) => {
    setIsPurchasing(video.id);
    
    // Simulate payment processing
    setTimeout(() => {
      const success = appStore.purchaseVideo(currentUser.id, video.id);
      if (success) {
        alert(`¡Video "${video.title}" comprado exitosamente!`);
      } else {
        alert('Error al comprar el video. Inténtalo de nuevo.');
      }
      setIsPurchasing(null);
    }, 1500);
  };

  const handlePurchaseDigitalRoutine = async () => {
    setIsPurchasing('digital-routine');
    
    // Simulate payment processing
    setTimeout(() => {
      const success = appStore.purchaseDigitalRoutine(currentUser.id);
      if (success) {
        alert('¡Rutina mensual digital comprada exitosamente!');
      } else {
        alert('Error al comprar la rutina. Inténtalo de nuevo.');
      }
      setIsPurchasing(null);
    }, 1500);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-blue-500';
      case 'Advanced': return 'bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'Beginner': return 'Principiante';
      case 'Intermediate': return 'Intermedio';
      case 'Advanced': return 'Avanzado';
      default: return level;
    }
  };

  return (
    <div id="videos" className="space-y-6">
      {/* Digital Routine Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2 mb-6">
          <Download className="w-6 h-6 text-green-600" />
          <span>Rutina Mensual Digital</span>
        </h2>
        
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Rutina Mensual Digital</h3>
              <p className="text-gray-600 mb-4">
                Plan de entrenamiento personalizado para todo el mes con ejercicios variados y progresivos.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600 text-sm">30 días de contenido</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600 text-sm">Nivel adaptable</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800 mb-2">$5.000</div>
              <button
                onClick={handlePurchaseDigitalRoutine}
                disabled={isPurchasing === 'digital-routine'}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {isPurchasing === 'digital-routine' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Comprar Rutina</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Library Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2 mb-6">
          <Play className="w-6 h-6 text-green-600" />
          <span>Videos On-Demand</span>
        </h2>

        {videos.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay videos disponibles</h3>
            <p className="text-gray-600 text-sm">
              Los videos aparecerán aquí cuando estén disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const isPurchased = isVideoPurchased(video.id);
              
              return (
                <div key={video.id} className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-green-300 transition-colors shadow-sm hover:shadow-md">
                  <div className="relative">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(video.level)} text-white`}>
                        {getLevelText(video.level)}
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        <Clock className="w-3 h-3" />
                        <span>{video.duration}min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-gray-800 font-bold mb-2 line-clamp-2">{video.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{video.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-800">
                        ${video.price.toLocaleString()} COP
                      </div>
                      
                      {isPurchased ? (
                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          <span>Reproducir</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchaseVideo(video)}
                          disabled={isPurchasing === video.id}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          {isPurchasing === video.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Comprando...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span>Comprar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedVideo.title}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="aspect-video bg-black rounded-lg mb-4">
              <iframe
                src={selectedVideo.videoUrl}
                className="w-full h-full rounded-lg"
                allowFullScreen
                title={selectedVideo.title}
              />
            </div>
            
            <div className="text-gray-600 text-sm">
              <p className="mb-2">{selectedVideo.description}</p>
              <div className="flex items-center space-x-4">
                <span>Duración: {selectedVideo.duration} minutos</span>
                <span>Nivel: {getLevelText(selectedVideo.level)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
