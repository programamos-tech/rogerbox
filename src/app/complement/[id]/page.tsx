'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ArrowLeft, Heart, Clock, Star, Play, Eye, CheckCircle, Calendar, Target, TrendingUp } from 'lucide-react';
import SimpleLoading from '@/components/SimpleLoading';

interface Complement {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  video_url?: string;
  is_new: boolean;
  duration: number;
  category: string;
  instructor: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  recommended_for?: string[];
  complement_stats?: {
    total_views: number;
    total_favorites: number;
    average_rating: number;
    total_ratings: number;
  };
  userRating?: number;
  userFavorite?: boolean;
  completed?: boolean;
  lastCompleted?: string;
  timesCompleted?: number;
  personalNotes?: string;
}




export default function ComplementDetail() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const [complement, setComplement] = useState<Complement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState<Array<{id: string, note: string, created_at: string}>>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Función separada para cargar interacciones
  const loadUserInteractions = async (complementId: string) => {
    if (!user?.id) {
      console.log('⚠️ Usuario no autenticado, no se cargan interacciones');
      return;
    }

    try {
      const userId = user?.id;
      console.log('🔍 Cargando interacciones para usuario:', userId);
      if (!userId) return;
      
      // Usar la API de debug que sabemos que funciona
      const interactionsResponse = await fetch(`/api/debug-interactions?complement_id=${complementId}&user_id=${userId}`);
      console.log('📡 Respuesta de interacciones:', interactionsResponse.status);
      
      if (interactionsResponse.ok) {
        const interactionsData = await interactionsResponse.json();
        console.log('📊 Datos de interacciones:', interactionsData);
        
        const userInteraction = interactionsData.interactions[0]; // Tomar la primera (y única) interacción
        
        console.log('🎯 Interacción encontrada:', userInteraction);
        
        if (userInteraction) {
          // Actualizar estados de manera más explícita
          const newIsCompleted = userInteraction.is_completed || false;
          const newIsFavorite = userInteraction.is_favorite || false;
          const newUserRating = userInteraction.user_rating || 0;
          const newNotes = userInteraction.notes_array || [];
          
          console.log('🔄 Actualizando estados...', {
            isCompleted: newIsCompleted,
            isFavorite: newIsFavorite,
            userRating: newUserRating,
            notesCount: newNotes.length
          });
          
          setIsCompleted(newIsCompleted);
          setIsFavorite(newIsFavorite);
          setUserRating(newUserRating);
          setNotes(newNotes);
          
          console.log('✅ Estados actualizados correctamente');
        } else {
          console.log('⚠️ No se encontró interacción para este complemento');
          // Resetear a valores por defecto si no hay interacción
          setIsCompleted(false);
          setIsFavorite(false);
          setUserRating(0);
          setNotes([]);
        }
      } else {
        console.log('❌ Error en la respuesta de interacciones:', interactionsResponse.status);
      }
    } catch (error) {
      console.log('❌ Error loading user interactions:', error);
    }
  };

  useEffect(() => {
    const fetchComplement = async () => {
      try {
        const complementId = params.id as string;
        console.log('🔍 Cargando complemento:', complementId);
        
        // Fetch complement data
        const complementResponse = await fetch(`/api/complements/${complementId}`);
        if (!complementResponse.ok) {
          console.error('Complement not found for ID:', complementId);
          setLoading(false);
          return;
        }
        const complementData = await complementResponse.json();
        console.log('📊 Complemento cargado:', complementData.complement.title);
        
        // Incrementar visualizaciones
        try {
          await fetch(`/api/complements/${complementId}/view`, {
            method: 'POST'
          });
          console.log('👁️ Visualizaciones incrementadas');
        } catch (error) {
          console.log('Error incrementing views:', error);
        }
        
        setComplement(complementData.complement);
        setLoading(false);
        
        // Cargar interacciones inmediatamente después de cargar el complemento
        if (user?.id && !!user) {
          console.log('🔄 Cargando interacciones inmediatamente después del complemento...');
          setTimeout(() => {
            loadUserInteractions(complementId);
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching complement:', error);
        setLoading(false);
      }
    };

    fetchComplement();
  }, [params.id, (user as any)?.user?.id, authLoading]);

  // useEffect para cargar interacciones cuando esté todo listo
  useEffect(() => {
    console.log('🔍 useEffect interacciones - complement:', !!complement, 'user:', !!(user as any)?.user?.id, 'authLoading:', authLoading);
    
    if (complement && (user as any)?.user?.id && !!user) {
      console.log('🔄 Cargando interacciones del usuario...');
      loadUserInteractions(complement.id);
    } else {
      console.log('⚠️ No se cumplen las condiciones para cargar interacciones:', {
        hasComplement: !!complement,
        hasUserId: !!(user as any)?.user?.id,
        authLoading: authLoading
      });
    }
  }, [complement, (user as any)?.user?.id, authLoading]);

  // useEffect adicional como respaldo - se ejecuta después de que todo esté cargado
  useEffect(() => {
    if (complement && !!user && (user as any)?.user?.id) {
      console.log('⏰ Respaldo: Cargando interacciones después de 1 segundo...');
      const timer = setTimeout(() => {
        console.log('🔄 Respaldo: Ejecutando carga de interacciones...');
        loadUserInteractions(complement.id);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [complement, authLoading, (user as any)?.user?.id]);

  // useEffect adicional que se ejecuta cuando la página está completamente cargada
  useEffect(() => {
    console.log('🔍 useEffect de montaje - complement:', !!complement, 'user:', !!(user as any)?.user?.id, 'authLoading:', authLoading);
    
    const loadDataOnMount = () => {
      console.log('🚀 Intentando carga inicial...');
      if (complement && (user as any)?.user?.id && !!user) {
        console.log('🚀 Carga inicial: Ejecutando loadUserInteractions...');
        loadUserInteractions(complement.id);
      } else {
        console.log('⚠️ Carga inicial fallida - condiciones no cumplidas');
      }
    };

    // Ejecutar inmediatamente
    loadDataOnMount();

    // También ejecutar después de un pequeño delay
    const timer = setTimeout(() => {
      console.log('⏰ Timer de 2 segundos ejecutándose...');
      loadDataOnMount();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []); // Solo se ejecuta una vez al montar

  const handleFavorite = async () => {
    if (!complement || !(user as any)?.user?.id || isFavoriting) {
      if (!(user as any)?.user?.id) {
        console.log('Usuario no autenticado - redirigiendo al login');
        router.push('/');
      }
      return;
    }

    setIsFavoriting(true);

    try {
      const response = await fetch('/api/user-interactions/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complement_id: complement.id,
          is_favorite: !isFavorite
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.is_favorite);

        // Update complement stats
        setComplement(prev => {
          if (!prev) return null;

          const currentStats = prev.complement_stats;
          if (!currentStats) {
            // Si no hay stats, crear uno básico
            return {
              ...prev,
              complement_stats: {
                total_views: 0,
                total_favorites: data.is_favorite ? 1 : 0,
                average_rating: 0,
                total_ratings: 0
              }
            };
          }

          return {
            ...prev,
            complement_stats: {
              ...currentStats,
              total_favorites: data.is_favorite
                ? currentStats.total_favorites + 1
                : Math.max(0, currentStats.total_favorites - 1)
            }
          };
        });
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleComplete = async () => {
    if (!complement || !(user as any)?.user?.id || isCompleting) {
      if (!(user as any)?.user?.id) {
        console.log('Usuario no autenticado - redirigiendo al login');
        router.push('/');
      }
      return;
    }

    setIsCompleting(true);

    try {
      const response = await fetch('/api/user-interactions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complement_id: complement.id,
          is_completed: !isCompleted
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsCompleted(data.is_completed);
        
        // Actualizar el estado local también
        setComplement(prev => prev ? {
          ...prev,
          timesCompleted: data.times_completed,
          lastCompleted: data.last_completed_at
        } : null);
        
        // Siempre marcar como completado después de hacer clic
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Error updating completion:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!complement || !(user as any)?.user?.id || isRating) {
      if (!(user as any)?.user?.id) {
        console.log('Usuario no autenticado - redirigiendo al login');
        router.push('/');
      }
      return;
    }

    setIsRating(true);
    
    try {
      const response = await fetch('/api/user-interactions/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complement_id: complement.id,
          rating: rating
        }),
      });

      if (response.ok) {
        setUserRating(rating);
        console.log('⭐ Rating actualizado:', rating);
      } else {
        console.log('❌ Error actualizando rating');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    } finally {
      setIsRating(false);
    }
  };


  const handleAddNote = async () => {
    if (!complement || !(user as any)?.user?.id || !newNote.trim() || isAddingNote) {
      return;
    }

    setIsAddingNote(true);

    try {
      const response = await fetch('/api/user-interactions/notes-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complement_id: complement.id,
          note: newNote.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(prev => [data.note, ...prev]);
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  if (loading || loading) {
    return <SimpleLoading message="Cargando complemento..." />;
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#164151]/80 via-[#29839c]/70 to-[#29839c]/60 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Inicia sesión para continuar</h1>
          <p className="text-white/80 mb-6">Necesitas estar logueado para interactuar con los complementos</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (!complement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#164151]/80 via-[#29839c]/70 to-[#29839c]/60 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Complemento no encontrado</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#164151]/80 via-[#29839c]/70 to-[#29839c]/60">
      {/* Header */}
      <header className="bg-transparent border-b border-white/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo RogerBox */}
            <div className="flex items-baseline">
              <span className="text-white font-black text-xl leading-none">ROGER</span>
              <span className="text-[#85ea10] font-black text-xl leading-none">BOX</span>
            </div>
            
            {/* Botón Volver */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div>
            {/* Video Player */}
            <div className="relative aspect-[9/16] max-w-md mx-auto bg-black rounded-2xl overflow-hidden mb-6">
              <iframe 
                src={complement.video_url || "https://player.vimeo.com/video/1120425801?badge=0&autopause=0&player_id=0&app_id=58479"} 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                title={complement.title}
                className="w-full h-full"
              ></iframe>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            {/* Complement Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{complement.title}</h1>
                  <p className="text-white/80 text-lg leading-relaxed mb-4">{complement.description}</p>
                </div>
                {complement.is_new && (
                  <div className="bg-[#85ea10] text-black px-3 py-1.5 rounded-lg text-sm font-black tracking-wide">
                    NUEVO
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span>{complement.duration} min</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <span className="px-2 py-1 bg-white/20 rounded text-xs">
                    {complement.difficulty}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <Eye className="w-4 h-4" />
                  <span>{complement.complement_stats?.total_views || 0} visualizaciones</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <Play className="w-4 h-4" />
                  <span>{complement.category}</span>
                </div>
              </div>

              {/* Rating Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = star <= (userRating || complement.complement_stats?.average_rating || 0);
                      const isHovered = star <= hoveredRating;
                      const shouldShow = isActive || isHovered;
                      
                      return (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          disabled={isRating}
                          className={`w-6 h-6 transition-all duration-300 transform ${
                            isRating 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:scale-110 cursor-pointer'
                          } ${
                            shouldShow
                              ? 'text-[#85ea10] drop-shadow-lg'
                              : 'text-white/30 hover:text-[#85ea10]/50'
                          }`}
                        >
                          <Star className={`w-6 h-6 ${shouldShow ? 'fill-current' : ''}`} />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-white/80 text-sm">
                    {userRating ? (
                      `Tu calificación: ${userRating}/5`
                    ) : (
                      `Calificación: ${complement.complement_stats?.average_rating || 0}/5`
                    )}
                  </span>
                </div>
              </div>


              {/* Actions */}
              <div className="flex items-center space-x-4">
                     <button
                       onClick={handleFavorite}
                       disabled={isFavoriting}
                       className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                         isFavoriting
                           ? 'bg-[#85ea10]/70 text-black/70 cursor-not-allowed'
                           : isFavorite
                           ? 'bg-[#85ea10] text-black hover:scale-105 active:scale-95'
                           : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105 active:scale-95'
                       }`}
                     >
                           {isFavoriting ? (
                             <>
                               <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                               <span className="animate-pulse">Guardando...</span>
                             </>
                           ) : (
                         <>
                           <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                           <span>{isFavorite ? 'En favoritos' : 'Agregar a favoritos'}</span>
                         </>
                       )}
                     </button>
                
              </div>
            </div>

            {/* Progress Tracking Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#85ea10]" />
                <span>Seguimiento Personal</span>
              </h3>
              
              {/* Completion Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-medium">Estado del ejercicio</span>
                         <button
                           onClick={handleComplete}
                           disabled={isCompleting}
                           className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                             isCompleting
                               ? 'bg-[#85ea10]/70 text-black/70 cursor-not-allowed'
                               : isCompleted
                               ? 'bg-[#85ea10] text-black hover:scale-105 active:scale-95'
                               : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105 active:scale-95'
                           }`}
                         >
                           {isCompleting ? (
                             <>
                               <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                               <span className="animate-bounce">¡Completando!</span>
                             </>
                           ) : (
                             <>
                               <CheckCircle className={`w-4 h-4 ${isCompleted ? 'fill-current' : ''}`} />
                               <span>{isCompleted ? 'Volver a realizar' : 'Marcar como completado'}</span>
                             </>
                           )}
                         </button>
                </div>
                
                {isCompleted && (
                  <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Última vez: {complement?.lastCompleted ? new Date(complement.lastCompleted).toLocaleDateString() : 'Nunca'}</span>
                    </div>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4" />
                              <span>Veces completado: {complement?.timesCompleted || 0}</span>
                            </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Notas personales</h4>
                
                {/* Add new note */}
                <div className="mb-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Agrega una nota sobre este ejercicio..."
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-[#85ea10] resize-none h-20"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isAddingNote}
                    className={`mt-2 font-bold px-4 py-2 rounded-lg transition-all duration-300 text-sm ${
                      isAddingNote
                        ? 'bg-[#85ea10]/70 text-black/70 cursor-not-allowed'
                        : !newNote.trim()
                        ? 'bg-[#85ea10]/50 text-black/50 cursor-not-allowed'
                        : 'bg-[#85ea10] hover:bg-[#7dd30f] text-black hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isAddingNote ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span className="animate-pulse">¡Guardando nota!</span>
                      </div>
                    ) : (
                      'Agregar nota'
                    )}
                  </button>
                </div>

                {/* Notes list */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-white/60 text-sm">No hay notas aún</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                        <p className="text-white text-sm mb-1">{note.note}</p>
                        <p className="text-white/50 text-xs">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {complement?.recommended_for && complement.recommended_for.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Recomendado para:</h4>
                  <div className="flex flex-wrap gap-2">
                    {complement.recommended_for.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#85ea10]/20 text-[#85ea10] rounded-full text-sm border border-[#85ea10]/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
