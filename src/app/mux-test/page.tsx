'use client';

import { useState } from 'react';
import MuxUploader from '@/components/MuxUploader';
import MuxVideoPlayer from '@/components/MuxVideoPlayer';

export default function MuxTestPage() {
  const [playbackId, setPlaybackId] = useState('');
  const [testVideoId, setTestVideoId] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🎬 Prueba de Mux Video Player
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sube un video y prueba el reproductor de RogerBox con Mux
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Uploader */}
          <div>
            <MuxUploader />
          </div>

          {/* Test Player */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🎥 Reproductor de Prueba
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Playback ID de Mux:
                </label>
                <input
                  type="text"
                  value={testVideoId}
                  onChange={(e) => setTestVideoId(e.target.value)}
                  placeholder="Pega aquí el Playback ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {testVideoId && (
                <div className="mt-4">
                  <MuxVideoPlayer
                    videoId={testVideoId}
                    courseImage="/images/course-placeholder.jpg"
                    courseTitle="Video de Prueba"
                    autoPlay={false}
                  />
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Instrucciones:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Sube un video usando el uploader</li>
                  <li>Copia el Playback ID que aparece</li>
                  <li>Pega el ID en el campo de arriba</li>
                  <li>¡Prueba el reproductor!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Información sobre Mux
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <p><strong>✅ Ventajas:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Calidad HD garantizada</li>
                <li>Streaming adaptativo</li>
                <li>CDN global</li>
                <li>Sin límites de usuarios</li>
              </ul>
            </div>
            <div>
              <p><strong>💰 Precios:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Plan gratuito: 100GB</li>
                <li>$0.20/GB almacenamiento</li>
                <li>$0.40/1000 minutos</li>
                <li>Sin costos ocultos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
