'use client';

import { useState } from 'react';
import { Download, Share2, Twitter, Facebook, Instagram, Linkedin, X } from 'lucide-react';

interface CertificateData {
  courseName: string;
  studentName: string;
  completionDate: string;
  duration: string;
  caloriesBurned: number;
  shareableCode: string;
}

interface CertificateGeneratorProps {
  certificateData: CertificateData;
  onClose: () => void;
}

export default function CertificateGenerator({ certificateData, onClose }: CertificateGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    setIsGenerating(true);
    // Simular generación del certificado
    setTimeout(() => {
      // Aquí iría la lógica real para generar el PDF
      console.log('Generando certificado...');
      setIsGenerating(false);
    }, 2000);
  };

  const handleShare = (platform: string) => {
    const text = `¡Acabé de completar el curso "${certificateData.courseName}" en RogerBox! 🎉`;
    const url = `https://rogerbox.com/certificate/${certificateData.shareableCode}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        // Instagram no tiene API de sharing directo, mostrar mensaje
        alert('Copia el enlace y compártelo en Instagram: ' + url);
        return;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Felicitaciones! 🎉
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Certificate Preview */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-[#85ea10]/10 to-[#85ea10]/5 border-2 border-[#85ea10] rounded-2xl p-8 text-center">
            {/* Certificate Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                CERTIFICADO DE COMPLETACIÓN
              </h1>
              <div className="w-24 h-1 bg-[#85ea10] mx-auto rounded-full"></div>
            </div>

            {/* Certificate Content */}
            <div className="mb-8">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Se certifica que
              </p>
              <h2 className="text-3xl font-bold text-[#85ea10] mb-6">
                {certificateData.studentName}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                ha completado exitosamente el curso
              </p>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                "{certificateData.courseName}"
              </h3>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-[#85ea10] mb-1">
                  {certificateData.duration}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Duración del curso
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-[#85ea10] mb-1">
                  {certificateData.caloriesBurned}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Calorías quemadas
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-[#85ea10] mb-1">
                  {certificateData.completionDate}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Fecha de finalización
                </div>
              </div>
            </div>

            {/* Certificate Footer */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Código de verificación
                  </div>
                  <div className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                    {certificateData.shareableCode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    RogerBox
                  </div>
                  <div className="text-lg font-bold text-[#85ea10]">
                    ROGER<span className="text-gray-900 dark:text-white">BOX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Descargar Certificado</span>
                </>
              )}
            </button>

            {/* Share Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleShare('twitter')}
                className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors"
                title="Compartir en Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                title="Compartir en Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('instagram')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-lg transition-colors"
                title="Compartir en Instagram"
              >
                <Instagram className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg transition-colors"
                title="Compartir en LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Share Link */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enlace para compartir
            </label>
            <div className="flex">
              <input
                type="text"
                value={`https://rogerbox.com/certificate/${certificateData.shareableCode}`}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://rogerbox.com/certificate/${certificateData.shareableCode}`);
                  alert('Enlace copiado al portapapeles');
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-r-lg transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
