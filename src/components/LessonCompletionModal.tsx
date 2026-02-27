'use client';

import { Award, Flame, TrendingUp, Heart } from 'lucide-react';

interface LessonCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  caloriesBurned: number;
  weightLoss: number; // en gramos
}

export default function LessonCompletionModal({
  isOpen,
  onClose,
  onNext,
  caloriesBurned,
  weightLoss
}: LessonCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#164151] to-[#29839c] rounded-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-black" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-4">
            ¡Clase Completada!
          </h3>

          {/* Stats */}
          <div className="space-y-4 mb-6">
            <div className="bg-black/40 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-2xl font-bold text-white">{caloriesBurned}</span>
                <span className="text-white/80">calorías quemadas</span>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="w-6 h-6 text-[#85ea10]" />
                <span className="text-2xl font-bold text-white">{weightLoss}g</span>
                <span className="text-white/80">de peso perdido</span>
              </div>
              <p className="text-white/60 text-sm">
                Equivale a aproximadamente {Math.round(weightLoss * 0.001 * 100) / 100} kg
              </p>
            </div>

            <div className="bg-black/40 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2">
                <Heart className="w-6 h-6 text-red-400" />
                <span className="text-white/80">¡Sigue así! Cada clase te acerca más a tu meta</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-transparent border border-white/30 hover:border-[#85ea10] text-white hover:text-[#85ea10] font-bold py-3 rounded-xl transition-all duration-300"
            >
              Continuar
            </button>
            <button
              onClick={() => {
                onClose();
                onNext();
              }}
              className="flex-1 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-xl transition-all duration-300"
            >
              Siguiente Clase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
