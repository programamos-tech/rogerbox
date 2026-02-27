'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Star, Clock, Eye, Filter, Search } from 'lucide-react';
import SimpleLoading from '@/components/SimpleLoading';

interface FavoriteItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'complement' | 'course' | 'blog';
  duration: string;
  category: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  rating: number;
  views: number;
  addedDate: string;
}

const favoriteItems: FavoriteItem[] = [
  {
    id: '1',
    title: 'Estiramiento Matutino',
    description: 'Rutina de 10 minutos para empezar el día con energía',
    thumbnail: '/images/complemento-1.jpg',
    type: 'complement',
    duration: '10 min',
    category: 'Flexibilidad',
    difficulty: 'Principiante',
    rating: 4.8,
    views: 1250,
    addedDate: '2024-01-15'
  },
  {
    id: '2',
    title: 'Respiración Profunda',
    description: 'Técnicas de respiración para relajación',
    thumbnail: '/images/complemento-2.jpg',
    type: 'complement',
    duration: '8 min',
    category: 'Relajación',
    difficulty: 'Principiante',
    rating: 4.6,
    views: 890,
    addedDate: '2024-01-14'
  },
  {
    id: '3',
    title: 'Curso de Fuerza Básica',
    description: 'Aprende los fundamentos del entrenamiento de fuerza',
    thumbnail: '/images/curso-fuerza.jpg',
    type: 'course',
    duration: '2 horas',
    category: 'Fuerza',
    difficulty: 'Principiante',
    rating: 4.9,
    views: 3200,
    addedDate: '2024-01-12'
  },
  {
    id: '4',
    title: 'Los 10 Mejores Ejercicios para Principiantes',
    description: 'Guía completa para empezar tu rutina de ejercicios',
    thumbnail: '/images/blog-principiantes.jpg',
    type: 'blog',
    duration: '5 min lectura',
    category: 'Guías',
    difficulty: 'Principiante',
    rating: 4.7,
    views: 4500,
    addedDate: '2024-01-10'
  }
];

const typeLabels = {
  complement: 'Complementos',
  course: 'Cursos',
  blog: 'Blog'
};

const typeColors = {
  complement: 'bg-[#85ea10]',
  course: 'bg-blue-500',
  blog: 'bg-purple-500'
};

export default function FavoritesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('recientes');

  const filteredItems = favoriteItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'recientes':
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  const handleItemClick = (item: FavoriteItem) => {
    switch (item.type) {
      case 'complement':
        router.push(`/complement/${item.id}`);
        break;
      case 'course':
         router.push(`/course/${(item as any).slug || item.id}`);
        break;
      case 'blog':
        router.push(`/blog/${item.id}`);
        break;
    }
  };

  const handleRemoveFavorite = (itemId: string) => {
    // Aquí implementarías la lógica para remover de favoritos
    console.log('Removing from favorites:', itemId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#164151]/80 via-[#29839c]/70 to-[#29839c]/60">
      {/* Header */}
      <header className="bg-transparent border-b border-white/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Heart className="w-6 h-6 text-[#85ea10]" />
              <span>Mis Favoritos</span>
            </h1>
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en favoritos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-[#85ea10] backdrop-blur-lg"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-white/60" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#85ea10] backdrop-blur-lg"
              >
                <option value="all" className="bg-gray-800">Todos</option>
                <option value="complement" className="bg-gray-800">Complementos</option>
                <option value="course" className="bg-gray-800">Cursos</option>
                <option value="blog" className="bg-gray-800">Blog</option>
              </select>
            </div>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#85ea10] backdrop-blur-lg"
            >
              <option value="recientes" className="bg-gray-800">Más recientes</option>
              <option value="rating" className="bg-gray-800">Mejor calificados</option>
              <option value="views" className="bg-gray-800">Más populares</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-white/80">
            {sortedItems.length} elemento{sortedItems.length !== 1 ? 's' : ''} en favoritos
          </p>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer group"
              onClick={() => handleItemClick(item)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] bg-gradient-to-br from-[#85ea10]/20 to-[#7dd30f]/20">
                {/* Placeholder for content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#85ea10] rounded-full flex items-center justify-center opacity-90">
                    <Heart className="w-8 h-8 text-black" />
                  </div>
                </div>

                {/* Type Badge */}
                <div className={`absolute top-3 left-3 ${typeColors[item.type]} text-white px-3 py-1.5 rounded-lg text-xs font-bold`}>
                  {typeLabels[item.type]}
                </div>

                {/* Remove from Favorites Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(item.id);
                  }}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-red-500/80 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>

                {/* Duration */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.duration}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm line-clamp-2 mb-3">
                  {item.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-white/60 mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-[#85ea10]" />
                    <span>{item.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{item.views}</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">
                    {item.difficulty}
                  </span>
                </div>

                {/* Added Date */}
                <div className="text-xs text-white/40">
                  Agregado: {new Date(item.addedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-white/40" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tienes favoritos</h3>
            <p className="text-white/60 mb-6">Agrega contenido a tus favoritos para verlo aquí</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Explorar contenido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
