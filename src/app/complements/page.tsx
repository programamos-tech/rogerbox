'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import ComplementSection from '@/components/ComplementSection';


const categories = [
  { name: 'Todos', emoji: '🌟', color: 'bg-white/20' },
  { name: 'Flexibilidad', emoji: '🤸', color: 'bg-blue-500/20' },
  { name: 'Relajación', emoji: '🧘', color: 'bg-purple-500/20' },
  { name: 'Calentamiento', emoji: '🔥', color: 'bg-orange-500/20' },
  { name: 'Bienestar', emoji: '💚', color: 'bg-green-500/20' },
  { name: 'Movilidad', emoji: '🏃', color: 'bg-cyan-500/20' },
  { name: 'Yoga', emoji: '🧘‍♀️', color: 'bg-pink-500/20' },
  { name: 'Cardio', emoji: '❤️', color: 'bg-red-500/20' },
  { name: 'Fuerza', emoji: '💪', color: 'bg-yellow-500/20' }
];

export default function AllComplements() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('recientes');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#164151]/80 via-[#29839c]/70 to-[#29839c]/60">
      {/* Header */}
      <header className="bg-transparent border-b border-white/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-3xl font-bold text-white">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
            </button>
            
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Todos los Complementos</h1>
          <p className="text-white/60 text-lg">Descubre rutinas y ejercicios para complementar tu entrenamiento</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar complementos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-[#85ea10] backdrop-blur-lg"
            />
          </div>

          {/* Category Filters */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-white/80 font-medium">Categorías:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                    selectedCategory === category.name
                      ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                  }`}
                >
                  <span className="text-base">{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Filter */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-white/80 font-medium">Ordenar por:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSortBy('recientes')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                  sortBy === 'recientes'
                    ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                }`}
              >
                <span className="text-base">🕒</span>
                <span>Más recientes</span>
              </button>
              <button
                onClick={() => setSortBy('populares')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                  sortBy === 'populares'
                    ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                }`}
              >
                <span className="text-base">🔥</span>
                <span>Más populares</span>
              </button>
              <button
                onClick={() => setSortBy('mejor_valorados')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                  sortBy === 'mejor_valorados'
                    ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                }`}
              >
                <span className="text-base">⭐</span>
                <span>Mejor valorados</span>
              </button>
            </div>
          </div>
        </div>

        {/* Complementos usando el mismo componente del dashboard */}
        <ComplementSection />
      </div>
    </div>
  );
}
