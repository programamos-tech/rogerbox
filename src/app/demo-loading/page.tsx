'use client';

import { useState } from 'react';
import SimpleLoading from '@/components/SimpleLoading';

export default function DemoLoadingPage() {
  const [showLoading, setShowLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  if (showLoading) {
    return <SimpleLoading message="¡Demostrando el loading!" showProgress={showProgress} size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#164151]/80 via-[#29839c]/70 to-[#29839c]/60 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          ROGER<span className="text-[#85ea10]">BOX</span>
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              setShowProgress(true);
              setShowLoading(true);
            }}
            className="block w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            🎬 Ver Loading con Progreso
          </button>
          
          <button
            onClick={() => {
              setShowProgress(false);
              setShowLoading(true);
            }}
            className="block w-full bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            ⚡ Ver Loading Simple
          </button>
        </div>
        
        <p className="text-white/60 mt-8 text-sm">
          Haz clic en cualquier botón para ver el loading screen
        </p>
      </div>
    </div>
  );
}
