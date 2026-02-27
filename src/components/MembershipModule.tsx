'use client';

import { useState, useEffect } from 'react';
import { appStore } from '@/lib/store';
import { User } from '@/types';
import { CreditCard, CheckCircle, XCircle, Lock } from 'lucide-react';

export default function MembershipModule() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      const state = appStore.getState();
      setCurrentUser(state.currentUser);
    });

    const state = appStore.getState();
    setCurrentUser(state.currentUser);

    return () => {
      unsubscribe();
    };
  }, []);

  if (!currentUser) return null;

  const handleActivateMembership = () => {
    setIsActivating(true);
    // Simulate payment processing
    setTimeout(() => {
      appStore.activateMembership(currentUser.id);
      setIsActivating(false);
    }, 1500);
  };

  const isActive = currentUser.membership?.isActive || false;
  const membershipStartDate = currentUser.membership?.startDate;
  
  // Helper function to safely format date
  const formatDate = (date: any) => {
    if (!date) return 'fecha no disponible';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'fecha no disponible';
      return dateObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'fecha no disponible';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-green-600" />
          <span>Membresía</span>
        </h3>
        <div className="flex items-center space-x-2">
          {isActive ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-500" />
          )}
          <span className={`font-bold text-lg ${isActive ? 'text-green-600' : 'text-red-500'}`}>
            {isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </div>

      {isActive ? (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-800 text-lg">Membresía Activa</span>
            </div>
            <p className="text-green-700 text-sm font-semibold">
              Tu membresía está activa desde el {formatDate(membershipStartDate)}
            </p>
            <p className="text-green-700 text-sm mt-2 font-semibold">
              Puedes reservar clases y acceder a todos los beneficios.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-700 text-lg">Sin Membresía</span>
            </div>
            <p className="text-red-700 text-sm font-semibold">
              Necesitas una membresía activa para reservar clases.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-2 text-lg">Activar Membresía</h4>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Precio mensual</p>
                <p className="text-3xl font-bold text-gray-800">$135.000 COP</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm font-semibold">Beneficios incluidos:</p>
                <ul className="text-sm text-gray-700 space-y-1 font-semibold">
                  <li>• Reserva de clases ilimitadas</li>
                  <li>• Acceso a videos on-demand</li>
                  <li>• Rutina mensual digital</li>
                </ul>
              </div>
            </div>
            
            
            <button
              onClick={handleActivateMembership}
              disabled={isActivating}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-lg"
            >
              {isActivating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  <span>💪 Activar Membresía</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
