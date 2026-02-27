'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function MuxUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [playbackId, setPlaybackId] = useState('');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Crear FormData para subir el archivo
      const formData = new FormData();
      formData.append('file', file);

      // Subir a Mux usando su API
      const response = await fetch('/api/mux/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPlaybackId(data.playbackId);
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Error uploading to Mux:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🎬 Subir Video a Mux
      </h3>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Selecciona un video para subir a Mux
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#85ea10] file:text-black hover:file:bg-[#7dd30f] disabled:opacity-50"
          />
        </div>

        {isUploading && (
          <div className="flex items-center justify-center space-x-2 text-[#85ea10]">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-2 border-[#85ea10]"></div>
            <span>Subiendo video...</span>
          </div>
        )}

        {uploadStatus === 'success' && playbackId && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">¡Video subido exitosamente!</p>
              <p className="text-sm">Playback ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{playbackId}</code></p>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p>Error al subir el video. Intenta nuevamente.</p>
          </div>
        )}

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p><strong>Formatos soportados:</strong> MP4, MOV, AVI, WebM</p>
          <p><strong>Tamaño máximo:</strong> 5GB (plan gratuito)</p>
          <p><strong>Calidad:</strong> Se procesará automáticamente en HD</p>
        </div>
      </div>
    </div>
  );
}
