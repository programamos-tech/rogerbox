'use client';

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Scale, Calendar, Activity, Clock, Flame } from 'lucide-react';

interface UserProfile {
  weight: number;
  height: number;
  target_weight?: number | null;
  goal_deadline?: string | null;
  name?: string;
  created_at?: string;
}

interface WeightRecord {
  date: string;
  weight: number;
}

interface InsightsSectionProps {
  userProfile: UserProfile | null;
}

export default function InsightsSection({ userProfile }: InsightsSectionProps) {
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [daysActive, setDaysActive] = useState(0);
  const [initialWeight, setInitialWeight] = useState<number | null>(null);

  // Simular historial de pesos (en producción vendría de la DB)
  useEffect(() => {
    if (userProfile) {
      // Calcular días activos desde que se registró
      if (userProfile.created_at) {
        const days = Math.ceil((new Date().getTime() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24));
        setDaysActive(Math.max(1, days));
      } else {
        setDaysActive(30); // Por defecto
      }

      // Simular historial de pesos (últimos 7 registros)
      // En producción esto vendría de una tabla weight_records
      const mockHistory: WeightRecord[] = [];
      const today = new Date();
      const currentWeight = userProfile.weight;
      
      // Peso inicial (simulado - sería el primer registro en DB)
      const estimatedInitialWeight = currentWeight + (Math.random() * 4 - 2); // ±2kg
      setInitialWeight(estimatedInitialWeight);

      // Generar historial de últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const weight = currentWeight + (Math.random() * 1 - 0.5); // Variación pequeña
        mockHistory.push({
          date: date.toISOString().split('T')[0],
          weight: Math.round(weight * 10) / 10
        });
      }
      setWeightHistory(mockHistory);
    }
  }, [userProfile]);

  if (!userProfile) return null;

  const calculateBMI = (weight: number, height: number) => {
    return weight / Math.pow(height / 100, 2);
  };

  const currentBMI = calculateBMI(userProfile.weight, userProfile.height);
  const initialBMI = initialWeight ? calculateBMI(initialWeight, userProfile.height) : null;
  
  // Calcular diferencia desde el inicio
  const weightChange = initialWeight ? userProfile.weight - initialWeight : 0;
  const bmiChange = initialBMI ? currentBMI - initialBMI : 0;

  // Calcular peso ideal
  const idealWeight = Math.round(22 * Math.pow(userProfile.height / 100, 2));
  const weightToGoal = userProfile.target_weight 
    ? userProfile.target_weight - userProfile.weight 
    : idealWeight - userProfile.weight;

  // Preparar datos para gráfico simple
  const maxWeight = Math.max(...weightHistory.map(w => w.weight), userProfile.weight);
  const minWeight = Math.min(...weightHistory.map(w => w.weight), userProfile.weight);
  const range = maxWeight - minWeight || 1;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 min-h-0">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-1">
          <Activity className="w-5 h-5 text-[#85ea10]" />
          <span>Tu Progreso</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Seguimiento desde que iniciaste en RogerBox
        </p>
      </div>
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2 space-y-4">
        
        {/* Resumen Rápido */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peso Actual</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{userProfile.weight} kg</p>
          </div>
          {initialWeight && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peso Inicial</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{initialWeight.toFixed(1)} kg</p>
            </div>
          )}
        </div>

        {/* Cambio de Peso */}
        {initialWeight && (
          <div className={`p-4 rounded-lg border ${
            weightChange < 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : weightChange > 0
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {weightChange < 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : weightChange > 0 ? (
                  <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                ) : (
                  <Scale className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Cambio desde el inicio
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.abs(weightChange).toFixed(1)} kg
                  </p>
                </div>
              </div>
              <div className={`text-lg font-bold ${
                weightChange < 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : weightChange > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </div>
            </div>
          </div>
        )}

        {/* Gráfico Simple de Progreso */}
        {weightHistory.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Evolución de Peso (últimos 7 días)
            </h4>
            <div className="relative h-24">
              {/* Línea base */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300 dark:bg-gray-600"></div>
              
              {/* Línea de progreso */}
              <svg className="absolute bottom-0 left-0 right-0 h-24" viewBox="0 0 200 60" preserveAspectRatio="none">
                <polyline
                  points={weightHistory.map((record, index) => {
                    const x = (index / (weightHistory.length - 1)) * 200;
                    const y = 60 - ((record.weight - minWeight) / range) * 50;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#85ea10"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Puntos */}
                {weightHistory.map((record, index) => {
                  const x = (index / (weightHistory.length - 1)) * 200;
                  const y = 60 - ((record.weight - minWeight) / range) * 50;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#85ea10"
                    />
                  );
                })}
              </svg>
            </div>
            {/* Etiquetas de fechas */}
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              {weightHistory.filter((_, i) => i % 2 === 0).map((record, i) => (
                <span key={i}>
                  {new Date(record.date).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Días Activo</p>
            </div>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{daysActive}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-2 mb-1">
              <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">IMC Actual</p>
            </div>
            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{currentBMI.toFixed(1)}</p>
          </div>
        </div>

        {/* Meta Objetivo */}
        {userProfile.target_weight && (
          <div className="bg-gradient-to-r from-[#85ea10]/10 to-[#7dd30f]/10 dark:from-[#85ea10]/20 dark:to-[#7dd30f]/20 rounded-lg p-4 border border-[#85ea10]/30">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-[#85ea10]" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Meta: {userProfile.target_weight} kg
              </h4>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {weightToGoal > 0 ? 'Faltan' : 'Has superado tu meta por'}
              </span>
              <span className={`text-sm font-bold ${weightToGoal > 0 ? 'text-[#85ea10]' : 'text-green-600'}`}>
                {Math.abs(weightToGoal).toFixed(1)} kg
              </span>
            </div>
            {/* Barra de progreso simple */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              {initialWeight && (
                <div
                  className="bg-[#85ea10] h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((userProfile.weight - initialWeight) / (userProfile.target_weight - initialWeight)) * 100))}%`
                  }}
                ></div>
              )}
            </div>
          </div>
        )}

        {/* Registro Reciente de Pesos */}
        {weightHistory.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Registros Recientes
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {weightHistory.slice(-5).reverse().map((record, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(record.date).toLocaleDateString('es', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {record.weight} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
